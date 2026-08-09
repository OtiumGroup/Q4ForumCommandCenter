-- Seeds the eo_resources catalog from the "BOOK-Moderator Resources" library.
-- The 54 underlying files were uploaded directly to the `eo-resources` Storage
-- bucket by Brian (dashboard drag-and-drop, bypassing the app entirely), into
-- folders matching each eo_resource_categories row (plus a "general" folder
-- for two files that didn't belong to any BOOK-Moderator Resources subfolder).
-- This migration only inserts the catalog rows pointing at those objects.

insert into eo_resources (category_id, title, file_path, file_type, sort_order) values
-- Overview
((select id from eo_resource_categories where name = 'Overview'), '2024 Forum Training - Participant Guide', 'overview/7578X_2024_ForumTraining_ParticipantGuide_8.5x11_v3.pdf', 'pdf', 1),
((select id from eo_resource_categories where name = 'Overview'), 'Communication Starters', 'overview/communication-starters.pdf', 'pdf', 2),
((select id from eo_resource_categories where name = 'Overview'), 'Creating a Safe Forum Environment', 'overview/CreatingaSafeForumEnvironment.pdf', 'pdf', 3),
((select id from eo_resource_categories where name = 'Overview'), 'Forum Roles', 'overview/ForumRoles.pdf', 'pdf', 4),
((select id from eo_resource_categories where name = 'Overview'), 'Guidelines for Impactful Virtual Forum Meetings', 'overview/Guidelines_for_Impactful_Virtual_Forum_Meetings.pdf', 'pdf', 5),
((select id from eo_resource_categories where name = 'Overview'), 'Meeting Scheduling Grid', 'overview/MeetingSchedulingGrid.pdf', 'pdf', 6),
((select id from eo_resource_categories where name = 'Overview'), 'Moderator Book Opening', 'overview/Moderator Book Opening.docx', 'docx', 7),
((select id from eo_resource_categories where name = 'Overview'), 'MTP Program Guide', 'overview/MTP Program Guide_REV_4_2025.pdf', 'pdf', 8),
((select id from eo_resource_categories where name = 'Overview'), 'New Forum Member Profile', 'overview/NewForumMemberProfile.pdf', 'pdf', 9),
((select id from eo_resource_categories where name = 'Overview'), 'Sample Forum Agenda', 'overview/Sample Forum Agenda.pdf', 'pdf', 10),
-- 5%
((select id from eo_resource_categories where name = '5%'), '5% Worksheet', 'five-percent/5_ Worksheet (1).pdf', 'pdf', 1),
((select id from eo_resource_categories where name = '5%'), '5%', 'five-percent/5_.pdf', 'pdf', 2),
((select id from eo_resource_categories where name = '5%'), 'Feelings Wheel', 'five-percent/Copy of Feelings Wheel.docx', 'docx', 3),
((select id from eo_resource_categories where name = '5%'), 'Feelings Inventory', 'five-percent/Feelings Inventory.pdf', 'pdf', 4),
-- Deep Dive
((select id from eo_resource_categories where name = 'Deep Dive'), 'Open Coached Deep Dive (v2.5)', 'deep-dive/Copy of Open Coached Deep Dive  EO v 2.5.pdf', 'pdf', 1),
((select id from eo_resource_categories where name = 'Deep Dive'), 'Deep Dive', 'deep-dive/Deep Dive.pdf', 'pdf', 2),
((select id from eo_resource_categories where name = 'Deep Dive'), 'Deep Dive Coach Worksheet', 'deep-dive/DeepDiveCoachWorksheet.pdf', 'pdf', 3),
((select id from eo_resource_categories where name = 'Deep Dive'), 'Deep Dive Presenter Worksheet', 'deep-dive/DeepDivePresenterWorksheet.pdf', 'pdf', 4),
((select id from eo_resource_categories where name = 'Deep Dive'), 'Deep Dive Scribe Worksheet', 'deep-dive/I - Scribe Worksheet.pdf', 'pdf', 5),
-- Forum Activities
((select id from eo_resource_categories where name = 'Forum Activities'), '3-Step Brainstorming', 'forum-activities/3stepBrainstorming.pdf', 'pdf', 1),
((select id from eo_resource_categories where name = 'Forum Activities'), 'Alignment Triangle', 'forum-activities/AlignmentTriangle.pdf', 'pdf', 2),
((select id from eo_resource_categories where name = 'Forum Activities'), 'Business Tools and Understanding', 'forum-activities/business tools and understanding.pdf', 'pdf', 3),
((select id from eo_resource_categories where name = 'Forum Activities'), 'Forum Peer Learning Pipeline Questionnaire', 'forum-activities/Copy of Forum Peer Learning Pipeline Questionnaire.pdf', 'pdf', 4),
((select id from eo_resource_categories where name = 'Forum Activities'), 'Wheel of Life Exercise', 'forum-activities/Copy of Wheel of Life Excercise.pdf', 'pdf', 5),
((select id from eo_resource_categories where name = 'Forum Activities'), 'Deeper Connection Activities', 'forum-activities/deeper connection activities.pdf', 'pdf', 6),
((select id from eo_resource_categories where name = 'Forum Activities'), 'Developing Topics', 'forum-activities/develop topics.pdf', 'pdf', 7),
((select id from eo_resource_categories where name = 'Forum Activities'), 'Forum Pulse Check', 'forum-activities/ForumPulseCheck.pdf', 'pdf', 8),
((select id from eo_resource_categories where name = 'Forum Activities'), 'Lifeline Exercise', 'forum-activities/Lifeline.pdf', 'pdf', 9),
((select id from eo_resource_categories where name = 'Forum Activities'), 'MTP Participant Handout', 'forum-activities/MTP Participant Handout_REV2024_KDv2 (1) copy.pdf', 'pdf', 10),
((select id from eo_resource_categories where name = 'Forum Activities'), 'Self-Reflection Exercises', 'forum-activities/self reflection exercises.pdf', 'pdf', 11),
((select id from eo_resource_categories where name = 'Forum Activities'), 'Short Exercises', 'forum-activities/short exercises.pdf', 'pdf', 12),
((select id from eo_resource_categories where name = 'Forum Activities'), 'Topical Discussions', 'forum-activities/Topical Discussions_2021.pdf', 'pdf', 13),
((select id from eo_resource_categories where name = 'Forum Activities'), 'Tuckman Forum Life Cycle', 'forum-activities/TuckmanForumLifeCycle.pdf', 'pdf', 14),
((select id from eo_resource_categories where name = 'Forum Activities'), 'When It Is Not a Deep Dive', 'forum-activities/WhenitisNotaDeepDive.pdf', 'pdf', 15),
-- Constitution
((select id from eo_resource_categories where name = 'Constitution'), 'Constitution (Reference Copy)', 'constitution/constitution.pdf', 'pdf', 1),
((select id from eo_resource_categories where name = 'Constitution'), 'Forum Constitution Template', 'constitution/ForumConstitutionTemplate_.pdf', 'pdf', 2),
((select id from eo_resource_categories where name = 'Constitution'), 'Forum Profile Template', 'constitution/ForumProfileTemplate.pdf', 'pdf', 3),
-- Retreat
((select id from eo_resource_categories where name = 'Retreat'), 'Creating Powerful Retreats', 'retreat/creating powerful retreats.pdf', 'pdf', 1),
((select id from eo_resource_categories where name = 'Retreat'), 'Creating Forum Vision', 'retreat/CreatingForumVision.pdf', 'pdf', 2),
((select id from eo_resource_categories where name = 'Retreat'), 'Forum Meeting Tools', 'retreat/Forum meeting tools.pdf', 'pdf', 3),
((select id from eo_resource_categories where name = 'Retreat'), 'MTP Participant Handout', 'retreat/MTP Participant Handout_REV2024_KDv2 (1).pdf', 'pdf', 4),
-- Forum Resources
((select id from eo_resource_categories where name = 'Forum Resources'), '10 Signs Your Forum Could Be in Danger', 'forum-resources/10SignsYourForumCouldBeInDanger.pdf', 'pdf', 1),
((select id from eo_resource_categories where name = 'Forum Resources'), 'Conflict Conversation Guide', 'forum-resources/ConflictConversationGuide_Mar2021.pdf', 'pdf', 2),
((select id from eo_resource_categories where name = 'Forum Resources'), 'Departing Members - Exit Strategy', 'forum-resources/Copy of Departing Members v2 (Exit Strategy).doc', 'doc', 3),
((select id from eo_resource_categories where name = 'Forum Resources'), 'Forum Health', 'forum-resources/forum health.pdf', 'pdf', 4),
((select id from eo_resource_categories where name = 'Forum Resources'), 'Forum Exit Presentation', 'forum-resources/ForumExitPresentation.pdf', 'pdf', 5),
-- EO Programs & Resources
((select id from eo_resource_categories where name = 'EO Programs & Resources'), 'Forum Products Flyer', 'eo-programs-resources/Copy of Forum Resources - 6261_Forum Products Flyer.pdf', 'pdf', 1),
((select id from eo_resource_categories where name = 'EO Programs & Resources'), 'Industry Forum Information', 'eo-programs-resources/Copy of Industry Forum Information.pdf', 'pdf', 2),
((select id from eo_resource_categories where name = 'EO Programs & Resources'), 'Forum Workshops', 'eo-programs-resources/Forum Workshops.pdf', 'pdf', 3),
((select id from eo_resource_categories where name = 'EO Programs & Resources'), 'Moderator Workshop Series Flyer', 'eo-programs-resources/ModeratorWorkshopSeriesFlyer.pdf', 'pdf', 4),
((select id from eo_resource_categories where name = 'EO Programs & Resources'), '2025 Member Product Guide', 'eo-programs-resources/Overview - 2025 Member Product Guide (GLC Version) FINAL.pdf', 'pdf', 5),
((select id from eo_resource_categories where name = 'EO Programs & Resources'), 'EO Programs', 'eo-programs-resources/programs.pdf', 'pdf', 6),
-- General (uncategorized)
(null, 'Forum Book Glossary', 'general/Forum Book Glossary.docx', 'docx', 1),
(null, 'Simple Lined Paper (Printable)', 'general/Simple A4 Lined Paper-9.pdf', 'pdf', 2);
