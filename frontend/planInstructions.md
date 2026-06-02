You are a senior frontend solutions architect.

I am designing the frontend for an internal web application for a small charity. The overall stack is React frontend with Node.js/Express backend, but for this task you must focus on the FRONTEND ONLY.

Your job is to create a detailed frontend implementation PLAN only — not production code yet.

Use the requirements below and the attached feature/flow diagrams as the source of truth.

Assume the frontend will use React with TypeScript.

==================================================
PROJECT CONTEXT
==================================================

This app is for internal staff / back office use only.

Primary users:
- Back Office Staff
- Office Management

Core business problem:
The charity currently manages staff scheduling (rota) and event/session planning through multiple spreadsheets and manual cross-checking, including checking Zoho People for leave/availability. This creates heavy admin overhead and makes it difficult to avoid scheduling conflicts and over-allocation.

Main objective:
Reduce manual coordination and admin effort so staff can focus more on direct youth engagement.

Measures of success:
- Time saved
- Reduced admin burden
- Fewer scheduling conflicts
- Easier rota planning and event staffing
- Better visibility of event delivery history and reporting

==================================================
WHAT THE SOLUTION IS / IS NOT
==================================================

This solution IS:
- An internal web app for automation and operational support
- Focused on replacing spreadsheet-driven rota and event coordination
- Focused on making scheduling clearer, faster, and less error-prone
- Designed realistically for a small charity context

This solution IS NOT:
- Replacing parent / child registration
- Replacing booking flows
- Replacing or redesigning external vendor systems such as Bookio, Zoho, or Xero

==================================================
FUNCTIONAL FRONTEND SCOPE
==================================================

The frontend must support these core areas:

1. Staff Scheduling / Rota
- Create and maintain a staff rota for an agreed programme of sessions
- Display staff availability
- Assign staff to sessions while:
  - respecting availability (holiday, sickness, etc.)
  - avoiding double-booking
  - preventing over-allocation beyond contracted hours
- Handle different contract types:
  - salaried staff
  - sessional staff
- Support staff who may decline shifts before committing
- Surface updates to staff availability and notify the rota maker that updates are required

2. Event / Session Scheduling
- Scheduling is based on a pre-agreed programme (e.g. school term or holiday block)
- Support occasional additions of new sessions mid-programme
- Allow rota updates when exceptional opportunities arise
- Session times are generally fixed once published
- Capture required staffing levels for a session
- Optionally flag sessions requiring staff with a specific qualification

3. Notifications (frontend planning only)
- Weekly staff notifications about assigned events
- Potential update notifications when rota changes
- The frontend should include the relevant UI states/workflows, but not implement the email system itself

4. Operational Data / Reporting
- Event types / dates
- Staff details (names, email, skills)
- View of upcoming events in:
  - list view
  - calendar view
- Historical view of events
- Event attendance and delivery records
- Reporting needs:
  - number of events delivered
  - number of attendees
  - staffing coverage / which staff delivered which event
- Payroll export is optional and should be considered future-ready, not core for now

==================================================
IMPORTANT BUSINESS RULES / UX CONSTRAINTS
==================================================

The UI should help users:
- take an agreed programme of sessions
- match staff availability
- prevent over-allocation
- support sessional staff who can refuse shifts
- handle changes when:
  - new sessions are added mid-term
  - exceptional opportunities arise

The UI should reduce:
- cross-checking
- manual decision making
- spreadsheet dependency

The design should be future-ready so that:
- data could later be imported from Zoho People
- data could later be exported to payroll systems
- but neither integration is required now

==================================================
AUTHENTICATION, ACCESS CONTROL & SECURITY (FRONTEND)
==================================================

In addition to the functional requirements, the frontend plan MUST explicitly consider authentication, account management, admin access, and secure frontend design.

--------------------------------------------------
Authentication (Login System)
--------------------------------------------------

The application is for internal staff only and must require authentication.

The frontend must:
- Assume a login-based system (email/username + password or SSO-style token/session approach)
- Handle authenticated and unauthenticated states cleanly
- Prevent unauthenticated access to protected routes
- Gracefully handle:
  - expired sessions
  - invalid credentials
  - forced logout
  - insufficient permissions
- Display appropriate loading, error, and retry states during authentication

You are NOT required to design the backend auth mechanism, but the frontend plan must clearly show:
- how authentication state is represented in the UI
- how routes and screens are protected
- how the user is redirected on login/logout/session expiry
- what the app shell does before auth state is known

--------------------------------------------------
User Roles & Access Control
--------------------------------------------------

The frontend must support role-based access.

At minimum, assume the following roles:
- Admin (e.g. Office Manager)
- Standard Staff User (e.g. Back Office Staff)

The frontend plan must:
- Identify which screens/actions are:
  - admin-only
  - shared
  - restricted or read-only for some roles
- Ensure users only see actions they are authorised to perform
- Prevent accidental access to admin-only features via UI controls
- Make role differences visible but not confusing

Examples of admin-only capabilities may include:
- managing staff accounts
- editing contract types or contracted hours
- overriding rota constraints
- accessing full reporting and export features
- managing reference data / settings

--------------------------------------------------
Account & User Management (Frontend Scope)
--------------------------------------------------

The frontend plan must include views and flows for:
- viewing a user’s own account/profile
- basic account management UI (e.g. name, email, role display, status)
- admin-level management of user accounts, such as:
  - creating staff accounts
  - activating/deactivating accounts
  - assigning roles
  - viewing account status
- handling users who are no longer active staff

Do not design backend APIs — focus on:
- screens
- forms
- validation
- confirmation and warning states
- safe and audit-friendly UX

--------------------------------------------------
Security Considerations (Frontend-Focused)
--------------------------------------------------

The frontend plan must explicitly address secure frontend practices.

Your plan should include:
- how sensitive data is handled in the UI
- how to avoid leaking information via:
  - URLs
  - client-side state
  - browser storage
  - logs
  - overly detailed error messages
- how to avoid insecure frontend assumptions such as:
  - relying only on hidden buttons for access control
  - trusting client-side role checks as the only protection
  - over-trusting client-supplied data
- how forms and inputs should be validated on the frontend
- how to safely handle:
  - authentication/session state
  - logout behaviour
  - permission errors
- how to fail safely when data is missing or permissions are denied

Do NOT implement cryptography or backend security.
Instead, describe:
- frontend responsibilities
- assumptions about backend enforcement
- where the frontend must not trust itself
- what secure coding expectations should guide implementation

--------------------------------------------------
Auditability & Operational Safety
--------------------------------------------------

The frontend should support safe operational use.

Your plan should consider:
- confirmation steps for high-impact actions
  (e.g. publishing a rota, removing staff from sessions, deactivating accounts)
- showing “who is affected” before confirming important changes
- making changes visible and reviewable before committing
- reducing the risk of accidental bulk changes
- supporting confidence when making rota updates close to delivery dates

==================================================
NON-FUNCTIONAL EXPECTATIONS
==================================================

The frontend should be:
- clear
- usable
- realistic for a small charity
- admin-efficient
- accessible
- maintainable
- secure by design
- easy to understand for non-technical internal staff

The security approach should be:
- pragmatic rather than enterprise-heavy
- appropriate for a small charity
- focused on preventing mistakes as much as preventing abuse

The app should work primarily on desktop, but remain usable on tablet-sized screens.

==================================================
DO NOT DO THESE THINGS
==================================================

Do not:
- design backend services
- write API implementations
- redesign Zoho / Xero / Bookio
- invent unnecessary enterprise complexity
- over-engineer for a huge organisation
- design custom auth protocols
- rely on obscurity as security
- generate production code yet unless explicitly requested later

==================================================
YOUR TASK
==================================================

Create a structured FRONTEND PLAN only.

Your response must include the following sections:

1. Product Understanding
- Summarise the problem being solved
- Identify the main frontend user goals
- Highlight what the frontend must optimise for

2. Proposed Frontend Information Architecture
- Main areas/modules of the app
- Suggested navigation structure
- Suggested page hierarchy
- What should be top-level screens vs subviews/modals/drawers

3. Key User Journeys
Describe the main user journeys step by step, such as:
- logging in and accessing the app
- creating a rota from a programme of sessions
- reviewing staff availability
- assigning staff to sessions
- handling shift acceptance / rejection
- adding a new session mid-programme
- reviewing upcoming events
- checking event history and reporting
- managing staff accounts as an admin
For each journey, identify what the user sees, decides, and edits.

4. Frontend Screens / Views
List all recommended screens/views for the MVP and briefly describe:
- purpose
- main UI sections
- key actions
- important data shown
- validation or warning states
Include likely screens such as:
- login
- dashboard
- rota planner
- session detail
- staff directory/profile
- availability view
- calendar/list views
- reporting/history
- notifications/changes review
- my account
- user/admin management

5. Component Architecture
Propose a sensible React component breakdown.
Include:
- page-level components
- reusable feature components
- shared UI components
- layouts
- auth guards
- modals/dialogs
- tables/cards/calendar widgets
- status badges / warning banners
Call out which components are likely reusable.

6. Frontend State Model
Describe the main frontend state domains, for example:
- auth/session
- current user / role
- staff
- sessions/events
- availability
- assignments
- rota status
- acceptance/decline states
- reporting filters
- notification status
- account management state
Explain which state is:
- page-local
- shared across features
- server-derived
- derived/computed in the UI

7. Domain Model / Data Shape Suggestions
Suggest the core frontend data models or interfaces the UI will need.
Focus on frontend-friendly shapes for:
- AuthenticatedUser
- Role / Permission
- Staff
- Availability
- Contract type
- Skill/qualification
- Programme
- Session/Event
- Session staffing requirements
- Assignment
- Assignment status
- Attendance / delivery record
- User account
- Reporting summary
Do not write backend schemas. Just propose the data the frontend expects.

8. Frontend Business Rules to Surface in the UI
Explain how the UI should communicate important rules, such as:
- unavailable staff cannot be assigned
- double booking must be flagged
- over-allocation must be shown before confirming
- sessional staff may need to accept/reject before confirmed
- qualification requirements may block or warn
- rota changes after publication should be visible
- deactivated users should not be assignable
Distinguish between:
- hard blockers
- warnings
- informational cues

9. UX Patterns and Interaction Design
Recommend the best interaction patterns for this app, such as:
- calendar vs table vs board layout
- filters and search
- conflict highlighting
- bulk actions
- assignment workflow
- confirmation / approval states
- change summaries
- account/admin workflows
- empty states
- loading/error states
Keep the design practical for admin users, not flashy.

10. Accessibility and Usability Considerations
List the accessibility and usability requirements the frontend should follow, especially for:
- busy admin users
- dense scheduling tables
- calendars
- colour-coded statuses
- keyboard navigation
- readable validation messages
- forms with sensitive or high-impact actions

11. Suggested Frontend Technical Approach
Recommend a reasonable frontend architecture for React, including:
- routing approach
- form handling approach
- data fetching approach
- state management approach
- date/time handling considerations
- component organisation
- folder structure
- route guarding approach
- permission-aware rendering approach
Do not write code, but explain the rationale for each choice.
Keep it pragmatic for an internal business app.

12. Authentication & Route Protection Plan
Explain:
- how login/logout flows work from a frontend perspective
- which routes are public vs protected
- how role-based access is enforced in navigation and screens
- how session expiry is handled in the UI
- how unauthorised access attempts should be presented

13. User Roles & Permissions Matrix
Provide a simple matrix showing:
- roles
- screens
- actions
- access level (view / edit / admin)
This should be understandable by non-technical stakeholders.

14. Account Management Screens & Flows
Describe:
- staff account list
- staff profile/account view
- role assignment UI
- activation/deactivation flows
- password/reset/invite placeholder states if relevant
- safeguards against accidental misuse
Focus on the frontend UX, not backend mechanics.

15. Frontend Security Checklist
Provide a concise checklist covering:
- authentication state handling
- secure routing
- safe data handling
- avoiding sensitive data leakage
- form validation
- error handling
- permission-aware rendering
- safe defaults
- audit-friendly UX patterns
- secure coding expectations for implementation and code reviews

16. Security Assumptions & Boundaries
Clearly state:
- what security responsibilities live in the frontend
- what must be enforced by the backend
- what the frontend must never assume
- where frontend-only protection is insufficient

17. MVP vs Later Enhancements
Separate the plan into:
- MVP (must-have first release)
- Phase 2 / later enhancements
Make sure optional items stay out of MVP unless essential.

18. Risks, Ambiguities, and Assumptions
Identify unclear areas or business questions that should be resolved before implementation.
Examples:
- how contracted hours are calculated and displayed
- how acceptance windows work for sessional staff
- what “published rota” means in practice
- whether reporting is summary-only or drill-down
- whether availability changes need audit history
- whether standard staff users can view all staff or only themselves
- how account deactivation interacts with historic event records
State your assumptions clearly.

19. Recommended Build Sequence
Provide a sensible implementation order for the frontend, e.g.:
- app shell/navigation/layout
- auth foundation and protected routing
- staff and session data views
- rota planner
- conflict and allocation states
- acceptance workflow
- admin/account management
- history/reporting
- polish/accessibility/security review
The sequence should reduce delivery risk and allow early feedback.

==================================================
OUTPUT STYLE
==================================================

- Be concrete and practical
- Be opinionated where useful
- Optimise for maintainability, usability, and security
- Keep the plan realistic for a small charity internal tool
- Avoid generic fluff
- Do not generate code
- Use headings and bullet points
- Where useful, include simple tables
- If something is unclear, make a reasonable assumption and label it clearly

At the end, include:
A) a proposed MVP screen list
B) a proposed component tree
C) the top 10 open questions for the product team
D) a concise frontend security review checklist
E) a suggested permission model for Admin vs Standard Staff