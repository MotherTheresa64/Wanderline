from pathlib import Path


def required_replace(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing expected source for {label}")
    return text.replace(old, new, 1)


app_path = Path("src/App.tsx")
text = app_path.read_text()

# Extract the modal/form layer from the application shell.
modal_start = text.index("function Modal(")
modal_block = text[modal_start:]
app = text[:modal_start].rstrip() + "\n"
modal_type_start = app.index("type ModalState=")
modal_type_end = app.index("\ntype SearchHit=", modal_type_start)
modal_type = app[modal_type_start:modal_type_end].strip().replace("type ModalState=", "export type ModalState=", 1)
app = app[:modal_type_start] + app[modal_type_end + 1:]
app = app.replace("const categories:ActivityCategory[]=['food','sight','transit','shopping','lodging','event','other'];\n", "")
app = app.replace("const reservationTypes:ReservationType[]=['Flight','Hotel','Rental car','Restaurant','Event','Other'];\n", "")
avatar_line = "function Avatar({member,small=false}:{member:TripMember;small?:boolean}){return <span className={small?'wl-avatar small':'wl-avatar'} title={member.name}>{member.initials}</span>}\n"
app = required_replace(app, avatar_line, "", "Avatar extraction")
needle = "import {firebaseReady,observeAuth,signInGoogle,signOutUser} from './firebase';\n"
app = required_replace(app, needle, needle + "import {Avatar} from './components/Avatar';\nimport {Modal,renderModal} from './components/TripModals';\nimport type {ModalState} from './components/TripModals';\n", "modal imports")
modal_block = modal_block.replace("function Modal(", "export function Modal(", 1).replace("function renderModal(", "export function renderModal(", 1)

Path("src/components").mkdir(exist_ok=True)
Path("src/components/Avatar.tsx").write_text(
    "import type {TripMember} from '../model';\n\n"
    "export function Avatar({member,small=false}:{member:TripMember;small?:boolean}){\n"
    "  return <span className={small?'wl-avatar small':'wl-avatar'} title={member.name}>{member.initials}</span>;\n"
    "}\n"
)
modal_imports = """import {useEffect,useRef,useState} from 'react';
import type {FormEvent,ReactNode} from 'react';
import {Archive,CalendarCheck2,CalendarDays,Luggage,Map,MapPin,MessageCircle,Receipt,Trash2,UserPlus,X} from 'lucide-react';
import {Avatar} from './Avatar';
import {addDaysToDateOnly,initials,memberName,money,normalizeMoney,sumMoney,toCents,todayLocalDate} from '../model';
import type {Activity,ActivityCategory,ActivityStatus,Expense,ExpenseCategory,MemberRole,PackingItem,Reservation,ReservationType,SavedPlace,SplitMode,Trip,TripMember,TripNote,Workspace} from '../model';

const categories:ActivityCategory[]=['food','sight','transit','shopping','lodging','event','other'];
const expenseCategories:ExpenseCategory[]=['Lodging','Food','Transportation','Activities','Shopping','Other'];
const reservationTypes:ReservationType[]=['Flight','Hotel','Rental car','Restaurant','Event','Other'];

"""
Path("src/components/TripModals.tsx").write_text(modal_imports + modal_type + "\n\n" + modal_block)

# Extract trip section rendering so App.tsx owns orchestration rather than every page implementation.
view_start = app.index("type OverviewProps=")
view_block = app[view_start:]
for name in ["Overview", "Itinerary", "Ideas", "Places", "Budget", "Packing", "NotesAndBookings", "Travelers", "ActivityLog"]:
    view_block = view_block.replace(f"function {name}(", f"export function {name}(", 1)
view_imports = """import {useState} from 'react';
import type {CSSProperties,ReactNode} from 'react';
import {ArrowRight,BookOpen,CalendarCheck2,CalendarDays,Check,Clock3,DollarSign,ExternalLink,FileText,Heart,Hotel,Luggage,Map,MapPin,Navigation,Plus,Receipt,Search,Settings2,ShieldCheck,Sparkles,Trash2,UserPlus,Users} from 'lucide-react';
import {Avatar} from './Avatar';
import {openGoogleMaps} from '../maps';
import {balances,dateLabel,memberName,money,minutesLabel,settlements,sumMoney,totalExpenses,tripDates,tripProgress} from '../model';
import type {ActivityCategory,ActivityStatus,Expense,ExpenseCategory,MemberRole,PackingItem,ReservationType,Trip,TripMember,View} from '../model';

const expenseCategories:ExpenseCategory[]=['Lodging','Food','Transportation','Activities','Shopping','Other'];

"""
Path("src/components/TripViews.tsx").write_text(view_imports + view_block)
app = app[:view_start].rstrip() + "\n"
app = app.replace("const expenseCategories:ExpenseCategory[]=['Lodging','Food','Transportation','Activities','Shopping','Other'];\n", "")
modal_import = "import type {ModalState} from './components/TripModals';\n"
app = required_replace(app, modal_import, modal_import + "import {ActivityLog,Budget,Ideas,Itinerary,NotesAndBookings,Overview,Packing,Places,Travelers} from './components/TripViews';\n", "trip view imports")

# Clean imports in the orchestration shell after extracting view/form implementations.
imports_end = app.index("import {firebaseReady")
app = """import {useEffect,useMemo,useRef,useState} from 'react';
import {
  Activity as ActivityIcon,ArrowRight,Bell,CalendarDays,Check,CheckCircle2,ChevronDown,DollarSign,
  Lightbulb,ListChecks,Luggage,MapPin,Menu,MoreHorizontal,NotebookTabs,Plus,RotateCcw,Search,Share2,
  Sparkles,Users,Wallet
} from 'lucide-react';
""" + app[imports_end:]
app = app.replace("import {openGoogleMaps} from './maps';\n", "")
old_model_imports = """import {
  addDaysToDateOnly,balances,dateLabel,daysUntilDate,initials,memberName,money,minutesLabel,normalizeMoney,
  settlements,sumMoney,todayLocalDate,toCents,totalExpenses,tripDates,tripProgress
} from './model';
import type {
  Activity,ActivityCategory,ActivityStatus,Expense,ExpenseCategory,MemberRole,PackingItem,
  Reservation,ReservationType,SavedPlace,SplitMode,Trip,TripMember,TripNote,View,Workspace
} from './model';
"""
new_model_imports = """import {dateLabel,daysUntilDate,initials,memberName,money,totalExpenses,tripDates,tripPermissions} from './model';
import type {Activity,Expense,Trip,View,Workspace} from './model';
"""
app = required_replace(app, old_model_imports, new_model_imports, "App model imports")

# Move permission derivation into the domain layer so fail-closed behavior is directly testable.
model_path = Path("src/model.ts")
model = model_path.read_text()
owner_helper = "export function tripOwner(trip:Trip){return trip.members.find(member=>member.role==='owner'&&member.status==='active')}\n"
permissions_helper = """export function tripPermissions(trip:Trip,userId:string){
  const member=trip.members.find(candidate=>candidate.id===userId&&candidate.status==='active');
  return {
    member,
    canEdit:Boolean(member&&(member.role==='owner'||member.role==='editor')),
    isOwner:Boolean(member?.role==='owner')
  };
}
"""
model = required_replace(model, owner_helper, owner_helper + permissions_helper, "trip permission helper")
model_path.write_text(model)
permission_block = """  const currentMember=trip?.members.find(member=>member.id===workspace.currentUserId&&member.status==='active');
  const canEdit=Boolean(currentMember&&(currentMember.role==='owner'||currentMember.role==='editor'));
  const isOwner=Boolean(currentMember?.role==='owner');
"""
permission_replacement = """  const permissions=trip?tripPermissions(trip,workspace.currentUserId):{member:undefined,canEdit:false,isOwner:false};
  const currentMember=permissions.member;
  const {canEdit,isOwner}=permissions;
"""
app = required_replace(app, permission_block, permission_replacement, "App permission derivation")
app_path.write_text(app)

# Extend domain regression coverage for Viewer/removed/unknown member permissions.
test_path = Path("tests/model.test.ts")
tests = test_path.read_text()
tests = required_replace(
    tests,
    "import {balances,daysBetween,daysUntilDate,expenseShare,memberName,settlements,sumMoney,toCents,tripDates} from '../src/model';",
    "import {balances,daysBetween,daysUntilDate,expenseShare,memberName,settlements,sumMoney,toCents,tripDates,tripPermissions} from '../src/model';",
    "model test import",
)
tests += """

test('trip permissions fail closed for viewers, removed members, and unknown ids',()=>{
  const trip=baseTrip();
  assert.deepEqual(tripPermissions(trip,'a'),{member:trip.members[0],canEdit:true,isOwner:true});
  assert.equal(tripPermissions(trip,'b').canEdit,true);
  assert.equal(tripPermissions(trip,'c').canEdit,false);
  trip.members[1].status='removed';
  assert.equal(tripPermissions(trip,'b').canEdit,false);
  assert.deepEqual(tripPermissions(trip,'missing'),{member:undefined,canEdit:false,isOwner:false});
});
"""
test_path.write_text(tests)

# Production and architecture documentation track the new boundaries.
render_path = Path("render.yaml")
render_path.write_text(render_path.read_text().replace(
    "npm install --include=dev --no-audit --no-fund && npm run check",
    "npm ci --include=dev --no-audit --no-fund && npm run check",
))
project_map = Path("docs/PROJECT_MAP.md")
project_text = project_map.read_text()
if "TripModals.tsx" not in project_text:
    project_text += """

## Component boundaries added during hardening

- `src/App.tsx` — application shell, workspace orchestration, routing/view state, permission-aware mutation seam, and global UI state.
- `src/components/TripViews.tsx` — trip section views and view-local presentation logic (overview, itinerary, ideas, places, budget, packing, notes/bookings, travelers, activity history).
- `src/components/TripModals.tsx` — accessible modal shell plus create/edit forms for trip-domain entities.
- `src/components/Avatar.tsx` — shared traveler identity primitive used by views and forms.

This split keeps the root application focused on coordination rather than embedding every page and form implementation in one file.
"""
project_map.write_text(project_text)
architecture = Path("docs/ARCHITECTURE.md")
architecture_text = architecture.read_text()
if "TripViews.tsx" not in architecture_text:
    architecture_text += """

## Frontend component boundaries

The root `App.tsx` owns workspace orchestration, global UI state, navigation, and the permission-aware mutation seam. Section presentation is separated into `components/TripViews.tsx`, while entity create/edit workflows and the accessible dialog implementation live in `components/TripModals.tsx`. `components/Avatar.tsx` is shared by both layers. This keeps cross-cutting state centralized without forcing all rendering and form logic into the application shell.
"""
architecture.write_text(architecture_text)

print("Frontend component-boundary refactor applied.")
