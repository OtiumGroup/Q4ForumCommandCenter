// The Q4 Forum's governing document, structured for a branded, native render.
// Faithful to "2025 Consitution.docx" (Rev 8.11.2025). Signatures are driven by
// the live member list, so the roster stays current automatically.

export const CONSTITUTION_VERSION = "2026-2027";
export const CONSTITUTION_REV = "Rev. 8/11/2025";
export const CONSTITUTION_TITLE = "4th Quarter Forum Constitution";

export type ConBlock =
  | { kind: "definition"; term: string; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "roles"; intro: string; roles: { name: string; desc: string }[] }
  | { kind: "table"; headers: string[]; rows: string[][] };

export type ConSection = { id: string; number: number; title: string; blocks: ConBlock[] };

export const FOUNDATION: { label: string; value: string }[] = [
  { label: "Purpose", value: "To hold each other accountable and provide assistance where needed to accomplish our personal, family, and business goals." },
  { label: "Vision", value: "To be known as the best EO Forum in the Fort Worth chapter." },
  { label: "Values", value: "Authenticity · Accountability · Trust · Growth · Excellence" },
  { label: "Group Size", value: "8 members" },
  { label: "Fiscal Year", value: "July 1, 2026 – June 30, 2027, in accordance with EO's calendar." },
  { label: "Position Terms", value: "July 1, 2026 – June 30, 2027." },
];

export const FORUM_POSITIONS: { key: string; name: string; desc: string; term: string; selection: string }[] = [
  { key: "moderator", name: "Moderator", desc: "Prepares and distributes the meeting agenda a week in advance; asks members to volunteer for the other roles; leads the group through the scheduling and parking-lot processes; leads by example; represents the Forum in the moderator meeting with the Chapter Forum Officer; and attends Moderator Training and Moderator Summits.", term: "1 year", selection: "Election" },
  { key: "moderator_elect", name: "Moderator-Elect", desc: "Facilitates the meeting whenever the Moderator is presenting, and attends moderator training to prepare to take over as Moderator. Manages the parking lot, keeps track of upcoming Deep Dive topics, and scribes for topics during the monthly 5% Reflection.", term: "1 year", selection: "Election" },
  { key: "accountability", name: "Accountability", desc: "Serves as the Forum\u2019s timekeeper \u2014 giving warnings as time elapses and a clear cue when time is up to keep the group on track \u2014 and enforces the Forum Constitution and Schedule of Fines.", term: "1 year", selection: "Volunteer" },
  { key: "connection", name: "Connection", desc: "Plans and organizes the Forum\u2019s social meetings and events \u2014 holiday party, family summer picnic, and the like \u2014 and promotes chapter involvement between monthly meetings.", term: "1 year", selection: "Volunteer" },
  { key: "finance", name: "Finance", desc: "Maintains Forum funds and keeps records for fines, dues, retreat costs, meals, and group activities; tracks absence, tardiness, and the group roster; and handles meeting logistics and housekeeping minutes.", term: "1 year", selection: "Volunteer" },
  { key: "coaching", name: "Coaching", desc: "Manages the parking lot for \u201CDeep Dive\u201D open-coaching sessions; meets with the presenter in advance and leads the group through the communication starter during the presentation; and coordinates presentations with third-party subject-matter experts and EO SAPs.", term: "1 year", selection: "Volunteer" },
  { key: "retreat_experience", name: "Retreat Experience", desc: "Plans and organizes the annual retreat and its logistics to create a memorable experience; may split logistics and content between people.", term: "Variable", selection: "Volunteer" },
];

export const SECTIONS: ConSection[] = [
  {
    id: "forum-guidelines",
    number: 1,
    title: "Forum Guidelines",
    blocks: [
      {
        kind: "definition",
        term: "EO Forum Mindset",
        text: "Forum members will follow the \u201CForum Mindset\u201D and speak only from experience at our Forum Meetings. A Forum member may choose to request specific feedback or opinions from other members.",
      },
      {
        kind: "definition",
        term: "Confidentiality",
        text: "Meeting agendas are not considered confidential and should omit any confidential information. All other communication is confidential, whether written or verbal. All communications between members shall be directly between members. A breach of confidentiality will result in the immediate termination of the member. Members may request permission from the author to share confidential information.",
      },
      {
        kind: "roles",
        intro: "All positions have a one-year term that coincides with the fiscal year. Positions should be assigned by the first Forum meeting of the new fiscal year.",
        roles: FORUM_POSITIONS.map((p) => ({ name: p.name, desc: p.desc }))
      },
      {
        kind: "definition",
        term: "New Members",
        text: "New members must be approved by unanimous consent of current Forum members. New members must be approved before the retreat in the current fiscal period and must complete EO's Forum Training prior to participation.",
      },
      {
        kind: "definition",
        term: "Member Participation, Commitment & Attendance",
        text: "Attendance is mandatory for all meetings, retreats, pre-planned social events, or \u201Cmini-retreats.\u201D A member who misses two mandatory events within a fiscal year is automatically removed from the Forum, unless unanimously voted back in. A missed Meeting or Retreat after being unanimously voted back in within the same fiscal year also triggers automatic removal, unless unanimously voted back in. A member who misses a Meeting or Retreat is fined according to the Schedule of Fines below.",
      },
      {
        kind: "definition",
        term: "Annual Membership Dues",
        text: "Dues for the fiscal year are set at $1,000 per member and are due on or before July 1st of each fiscal year. Dues are applied directly to retreat expenses, unless otherwise agreed by a majority of the Forum. Any excess, unused dues are attributed toward retreat expenses for the following fiscal year.",
      },
      {
        kind: "definition",
        term: "Financial Responsibility for Retreat Expenses",
        text: "A member who misses the retreat is obligated to pay their percentage share as if they had attended.",
      },
      {
        kind: "definition",
        term: "Use of Fines",
        text: "Fines collected throughout the fiscal year are applied directly to retreat expenses, unless otherwise agreed by a majority of the Forum. Any excess rolls over to the next fiscal year's retreat budget. Fines are described in the Schedule of Fines below.",
      },
      {
        kind: "definition",
        term: "Romantic Relationships",
        text: "No romantic relationships of any kind are permitted between Forum members.",
      },
      {
        kind: "definition",
        term: "Business Dealings",
        text: "Business transactions greater than $10,000 are discouraged among Forum members and must be disclosed to the Forum. Transactions greater than $10,000 between Forum members must be pre-approved with unanimous consent before the transaction takes place. If necessary, a blind vote may be used. Those involved in the transaction are required to abstain from the vote.",
      },
      {
        kind: "definition",
        term: "Membership Resignation",
        text: "Members resigning from the Forum are expected to communicate their intent in person and participate in an exit interview. A member who resigns immediately forfeits any balance of Forum dues paid, and will pay any balance due within 24 hours of resignation to the extent the retreat has already incurred financial commitments based on their participation. Members who do not make an exit presentation or meet their financial responsibility will be recommended for termination from EO.",
      },
      {
        kind: "definition",
        term: "Member Reinstatement",
        text: "Any member removed from the Forum must make a request in person to rejoin and is expected to participate in a readmission interview. Reinstatement requires unanimous consent by current Forum members.",
      },
      {
        kind: "definition",
        term: "Conflict Resolution",
        text: "Members involved in a conflict should attempt to resolve it directly with each other. Conflicts that cannot be resolved directly should be brought to the Moderator for facilitation; if the conflict involves the Moderator, the Moderator-Elect should assist. A conflict that cannot be resolved should be brought to the Forum's attention by the Moderator or Moderator-Elect. Conflicts that remain unresolved for more than 30 days can result in a vote by the uninvolved members to determine whether removing one or more members is necessary.",
      },
    ],
  },
  {
    id: "meeting-guidelines",
    number: 2,
    title: "Meeting Guidelines",
    blocks: [
      {
        kind: "definition",
        term: "Meeting Frequency & Schedule",
        text: "The Forum hosts eleven meetings and one retreat each year, unless unanimously approved otherwise. Meetings are 4 hours, and dates are agreed upon 60 days in advance. One of the eleven monthly meetings may be a mandatory social event or \u201Cmini-retreat\u201D and counts for attendance.",
      },
      {
        kind: "definition",
        term: "Meeting Format",
        text: "All meetings are in-person, facilitated by the Moderator or Moderator-Elect who has attended EO Moderator Training. The format is communicated beforehand via agenda. At least one Deep Dive occurs during each meeting; 5% Reflections occur during every meeting and at least once during the retreat.",
      },
      {
        kind: "definition",
        term: "Preparation",
        text: "Members come fully prepared and ready to participate, including completed 5% Reflections on the agreed printed form, and bring their calendars to every meeting. Each member should be ready to explore a deep-dive topic with open-coaching. Members presenting a pre-determined topic must be fully prepared with materials, handouts, videos, and screen connections.",
      },
      {
        kind: "definition",
        term: "Punctuality",
        text: "A member late for a meeting is fined per the Schedule of Fines. Being late by more than one minute (per the Moderator's mobile phone) accrues a one-half absence and a fine; four half-absences in a fiscal year result in automatic removal. Arriving more than 20 minutes late counts as a missed meeting, and the member may not join to avoid disruption. Any member with a medical emergency or arriving late (under twenty minutes) must call the Moderator before the meeting starts.",
      },
      {
        kind: "definition",
        term: "Request to Change Meeting Date/Time",
        text: "A member requesting to change a single meeting date or time must coordinate with the other members, and it must be unanimously approved by all members.",
      },
      {
        kind: "definition",
        term: "Request to Join Virtually",
        text: "A member may request to join virtually one time per fiscal year and pay a fine (per the Schedule of Fines) intended to discourage virtual attendance. The member must arrange with an in-person member to assist with the required technology. Events outside regular meetings cannot be attended virtually. Camera on with headphones, attending only the update portion (giving an update and listening to other members).",
      },
      {
        kind: "definition",
        term: "Emergency Meetings",
        text: "A member in need of an emergency meeting is responsible for coordinating it with all members, including any meeting technology. Attendance is not mandatory but is highly encouraged.",
      },
      {
        kind: "definition",
        term: "Annual Retreat",
        text: "A mandatory retreat is held annually with a maximum budget of $2,500 per member (not including flights) and is limited to within a 4-hour flight.",
      },
      {
        kind: "definition",
        term: "Mobile Phones",
        text: "Mobile phones and other outside distractions are not allowed during meetings or retreats except during designated times, breaks, or as approved by the Forum. Devices should be in airplane mode or off. Violation results in a fine per the Schedule of Fines.",
      },
      {
        kind: "definition",
        term: "Dining & Drinking",
        text: "Consumption of alcoholic and non-alcoholic beverages, tobacco, or food is permitted before and after meetings so long as it does not impair active participation. No alcohol is permitted during meetings. Alcohol during retreats is only permitted during designated times. Food may be available but should not distract from the Forum experience; to respect members while speaking, no food is permitted during 5% Reflections or Deep-Dive coaching.",
      },
    ],
  },
  {
    id: "schedule-of-fines",
    number: 3,
    title: "Schedule of Fines",
    blocks: [
      { kind: "paragraph", text: "The following fines are applied to a member who violates one of the requirements of the Forum." },
      {
        kind: "table",
        headers: ["Violation", "Fine"],
        rows: [
          ["Miss Retreat", "Percentage share of expenses + $200"],
          ["Late / absent at Forum Meeting", "$100"],
          ["Virtual attendance to Forum Meeting", "$50"],
          ["Text / calls on mobile phone during Forum Meeting", "$25 per use"],
        ],
      },
    ],
  },
  {
    id: "eo-policies",
    number: 4,
    title: "EO Regional General Practices & Policies",
    blocks: [
      { kind: "paragraph", text: "All members of an EO Forum must be EO members in good standing. It is considered a failure of our Trust and Respect principles when Forums permit non-EO members, or EO members not in good standing, to participate. Forums allowing this shall be considered failed Forums and removed from the record as an EO Forum, with remaining members listed as opting out. The Forum chair will make best efforts to help members of failed Forums join successful EO Forums in good standing." },
      { kind: "paragraph", text: "Once labeled a failed Forum, it is no longer entitled to EO Global or Chapter Forum resources \u2014 including Forum training, moderator training, moderator lunches, and other EO Forum benefits." },
      { kind: "paragraph", text: "EO bylaws, codes of conduct, policies, and procedures apply to all members of EO regardless of Forum status. Inviting other members to a failed Forum is a violation of this policy. Violation of the rules is cause for expulsion from EO." },
    ],
  },
  {
    id: "health-survey",
    number: 5,
    title: "EO Forum Health Survey",
    blocks: [
      { kind: "paragraph", text: "Forum members will evaluate the Forum annually using EO's Forum survey tool(s) when the new Moderator takes over." },
    ],
  },
];
