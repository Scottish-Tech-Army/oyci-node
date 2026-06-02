## Problem Statement

Reduce or eliminate manual coordination currently done by spreadsheets and cross‑checking systems.

Multiple spreadsheets

Cross-checking Zoho People for leave

This process takes significant time for office manager and business support staff

Prevent scheduling conflicts.

Manual judgement calls to avoid over-allocation

Make it easier to:

Plan programmes

Allocate staff

Report impact to funders and stakeholders

Be clear, usable, and realistic for a small charity context.



What the solution IS NOT replacing or redesigning

Parent / Child registration

Booking flows

External vendor systems (Bookio, Zoho, Xero)



Non-functional requirements:

Web App for internal / back office staff only - Focused on automation, replacing spreadsheets

Solution should reduce

Cross-checking

Decision making

Integration with Zoho People API - Ideally



Scheduling / Rota:

Staff Scheduling

Creating and maintaining a staff rota for an agreed programme of sessions.

Display Staff Availability

Assigning staff to sessions while:

Respecting staff availability (e.g. holidays, sickness)

Avoiding double‑booking

Preventing over‑allocation beyond contracted hours

The system should accommodate:

Different contract types (e.g. salaried vs sessional staff)

Staff who may decline shifts before committing

Updates to staff availability - notify ROTA maker an update is required

Event Scheduling / Creation / Handling

Scheduling is based on a pre‑agreed programme (e.g. school term or holiday block).

The system should:

Support occasional additions of new sessions mid‑programme

Allow rota updates when exceptional opportunities arise

Session times are generally fixed once published; frequent changes are not expected.

An appropriate number of staff per session

Based on the nature of the activity and safeguarding needs

Flagging sessions that require staff with specific qualification - OPTIONAL

Notifications

Notify staff about which events they are assigned to on weekly basis, via email

Suppose we we will have to send them updates every time there is a change….



Operational Data handling / reporting

Event Types / Dates

Staff details (names, email, skills)

View of upcoming events - List and Calendar

Historical view of events

Event Attendance and Delivery records

Number of events delivered

How many people attended

Staffing coverage - Which staff delivered which event

Exports for payroll system - OPTIONAL


## Constraints

Internal back‑office application

Used only by OYCI staff (office manager / business support)

Staff rota creation and management

Ability to create and maintain a staff rota for an agreed programme of sessions

Replace spreadsheet‑based scheduling

Update the ROTA based on changes

Staff‑to‑session assignment

Assign staff members to sessions

Prevent double‑booking across overlapping sessions

Staff availability awareness

Ability to reflect staff availability (e.g. leave, sickness), even if entered manually

Ensure staff are not scheduled when unavailable

Contracted hours protection

Avoid over‑allocating staff beyond their contracted hours

Support different contract types (salaried vs sessional)

Safeguarding‑aware coverage

Ensure the correct number of staff are allocated per session

Support safe delivery of activities for children and young people

Clear rota visibility

Easy‑to‑read view of:

Who is working

Where / When



Should Have

These significantly improve usability and effectiveness but are not required for a viable hack solution.

Programme‑based scheduling

Build rotas around a defined programme (e.g. school term or holiday block)

Session updates

Ability to add or amend sessions mid‑programme when needed

Future‑ready data design

Structure data so it could later:

Import availability from Zoho People

Export scheduling data for payroll

No live integration required now

Manual override capability

Allow staff to make judgement‑based adjustments where needed

Reflect real‑world flexibility in staffing decisions

Basic reporting views

Simple summaries such as:

Sessions covered

Staff utilisation per programme

Could Have

Session qualification flags

Mark sessions that require specific staff skills or qualifications

Support future safeguarding or compliance needs

Improved UX over spreadsheets

Visual layout that reduces cognitive load compared to Excel

Cleaner interaction for rota creation and updates



Won’t Have (Explicitly out of scope)

These were clearly stated as not required and should not be addressed in the hack.

Parent or child‑facing functionality

Booking, registration, or consent management

Rebuilding or fixing Bookio limitations

Family accounts or multi‑child booking logic

Payroll calculation or pay processing

Full CRM or HR system replacement

## Additional Information

The apps you produce are not just experimental.
The winners will be used by the charities.
These will have to be exported from LBG, then deployed and attached to persistent datastores by volunteers outside of LBG.  Volunteers and the charities will then support the apps.
A full product is more than just a runtime app.
It includes all the artifacts need to use and run the app.
This might include:
- help files for users
- admin mode to manage the underlying data
  (how implement user security without an AuthN/AuthZ infrastructure..?)
- instructions for deploying, supporting and updating the app
- consideration of future changes and data integrity
- whatever else you can think of…
  Again, hint, hint for the judging.
  Another hint- this may be a case where M365 Copilot may be more appropriate than Github Copilot…