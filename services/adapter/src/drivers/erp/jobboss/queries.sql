------------------------------------------------------------------
-- sample queries
------------------------------------------------------------------

-- can run these in jobboss by going to grafana, datasources,
-- jobboss, explore, then format as table, and enter a query. 
-- eg https://grafana-004-oxbox.teleport.ladder99.com/explore


-- get latest jobnums for a workcenter
select top 100
  actual_start as time,
  job,
  status, -- C completed, O ongoing? S started?
  *
from
  job_operation
where
  -- status <> 'C' and
  workcenter_oid = '8EE4B90E-7224-4A71-BE5E-C6A713AECF59' -- marumatsu
order by
  actual_start desc


-- check if workcenter has a schedule override for a certain date.
-- returns Shift_ID of the override shift, and Is_Work_Day=0 or 1,
-- or no record if no override.
select
  Shift_ID, 
  Is_Work_Day 
from
  WCShift_Override
where 
  WorkCenter_OID='8EE4B90E-7224-4A71-BE5E-C6A713AECF59' -- marumatsu
  and cast(Date as date)='2022-02-03';

-- if no record then lookup workcenter in WCShift_Standard.
-- get shift_id, look that up with sequencenum in shift_day table for start/end
-- (or do a join query)
select cast(Start_Time as time) start, cast(End_Time as time) stop
from WCShift_Standard wss
  join Shift_Day sd on wss.Shift_ID=sd.Shift
where WorkCenter_OID='8EE4B90E-7224-4A71-BE5E-C6A713AECF59' -- marumatsu
  and Sequence=1 -- day of week, 1=mon


-- if override and isworkday then lookup hours in shift_day table -
--   get shift_id, lookup in shift_day table with dayofweek for sequencenum
--   get start/end times from record
select cast(Start_Time as time) start, cast(End_Time as time) stop
from WCShift_Override wso
  join Shift_Day sd on wso.Shift_ID = sd.Shift
where WorkCenter_OID='8EE4B90E-7224-4A71-BE5E-C6A713AECF59' -- marumatsu
  and Date='2022-01-22' and Sequence=6


------------------------------------------------------------------
-- experiments
------------------------------------------------------------------

-- get sequence for a date, with 1=monday
-- and sd.[Sequence] = (@@datefirst - 1 + datepart(weekday, getdate()) ) % 7

-- get day of week of a datetime
-- sunday will always be zero
-- see https://stackoverflow.com/questions/1110998/get-day-of-week-in-sql-server-2005-2008#comment11887935_1113891
select (@@datefirst - 1 + datepart(weekday, getdate()) ) % 7;

-- get time from a datetime
select cast(getdate() as time);


select @@datefirst; -- 7 ie sunday
select (@@datefirst - 1 + datepart(weekday, '2022-01-13')) % 7 -- 4=thu, with sun=0 

select convert(varchar, '2022-01-13', 1); -- '2022-01-13'

select datepart(weekday, '2022-01-13'); -- 5=thurs, so sun=1 - subtract 1

--select datefirst;

select top 10 * from shift_day;

select top 50 objectid, Shift_ID, hours, WorkCenter_OID from WCShift_Standard;

select top 20 work_center, type, note_text, parent_id from work_center;

select top 10 * from Shift_Override;


------------------------------------------------------------------
-- old
------------------------------------------------------------------

-- get default schedule for a shift and datetime (getdate() here), eg 
--   shift, day, start, stop
--   FIRST, 1, 05:00:00, 13:30:00
select
  s.Shift_Name as shift, 
  sd.[Sequence] day, 
  cast(sd.Start_Time as time) start, 
  cast(sd.End_Time as time) stop
from
  [Shift] s
  inner join Shift_Day sd on s.[Shift] = sd.[Shift]
  --inner join Shift_Override so on sd.[Shift] = so.ObjectID
where
  Shift_Name = 'FIRST'
  -- this gets day of week with 1=monday, to match sequence numbers of 1-5
  and sd.[Sequence] = (@@datefirst - 1 + datepart(weekday, getdate()) ) % 7
order by
  s.Shift_Name, sd.Sequence;


-- get override schedule
-- this query gives override dates - holidays, saturdays, etc.
-- these override the default schedule set in ___.
-- note:
--   wss = workcenter shift standard
--   wso = workcenter shift override
select
  top 3
  wc.Department, wc.Work_Center, s.Shift_Name, wso.date OverrideDate, 
  wso.Is_Work_Day OverrideIsWorkDay, 
  wso.Last_Updated wsoLastUpdated, 
  wss.Shift_ID wssShiftID, wso.Shift_ID wsoShiftID
from
  [Production].[dbo].[WCShift_Standard] wss
  inner join [Production].[dbo].[WCShift_Override] wso on wss.WorkCenter_OID = wso.WorkCenter_OID
  inner join [Production].[dbo].[Work_Center] wc on wss.WorkCenter_OID = wc.ObjectID
  inner join [Production].[dbo].[Shift] s on s.Shift = wss.Shift_ID
  inner join [Production].[dbo].[Shift_Override] so on wso.Shift_ID = so.ObjectID
where
  s.shift_name = 'FIRST'
  and wc.ObjectID = '8EE4B90E-7224-4A71-BE5E-C6A713AECF59' -- marumatsu
  --and wc.Work_Center = 'MARUMATSU'
order by
  wso.Last_Updated desc;


-- wc schedule
-- check here for override entry for a machine and date?
select top 10
  wc.Department, wc.Work_Center, s.Shift_Name, 
  wso.date OverrideDate, wso.Is_Work_Day OverrideIsWorkDay,  
  wss.Shift_ID standardShiftID, wso.Shift_ID overrideShiftID, s.[Shift] shiftID
from 
  [Production].[dbo].[WCShift_Standard] wss
  inner join [Production].[dbo].[WCShift_Override] wso on wss.WorkCenter_OID = wso.WorkCenter_OID
  inner join [Production].[dbo].[Work_Center] wc on wss.WorkCenter_OID = wc.ObjectID
  inner join [Production].[dbo].[Shift] s on s.Shift = wss.Shift_ID
  inner join [Production].[dbo].[Shift_Day] sd on s.Shift = sd.Shift
  inner join [Production].[dbo].[Shift_Override] so on wso.Shift_ID = so.ObjectID
where 
  wc.ObjectID = '8EE4B90E-7224-4A71-BE5E-C6A713AECF59' -- marumatsu

  --and wso.date = '2022-01-01' -- nowork holiday sat
  --and wso.date = '2022-01-02' -- nowork holiday sun
  and wso.date = '2022-01-03' -- nowork holiday monday? but two records?
  --and wso.date = '2022-01-04' -- regular day tues - no entries
  --and wso.date = '2022-01-08' -- working saturday
;

-- shift default times (year=1899) for day of week
select
  s.Shift_Name, sd.[Sequence], sd.Start_Time, sd.End_Time 
from 
  [Shift] s
  inner join [Shift_Day] sd on s.Shift = sd.Shift
  --inner join Shift_Override so on sd.[Shift] = so.ObjectID
where
  shift_name = 'FIRST'
  and sequence = 2 -- tues
order by 
  s.Shift_Name, sd.Sequence 
;

-- This should return a result of 0 records for today if there are no 
-- overrides for today. If a record is returned then there is an override 
-- for the day and we need to use that. 
select top 10
  wc.Department, wc.Work_Center, s.Shift_Name, 
  wso.date OverrideDate, 
  --wso.Hours OverrideHours, 
  wso.Is_Work_Day OverrideIsWorkDay, 
  --wc.Setup_Labor_Rate, wc.Run_Labor_Rate,
  --wss.Machines, wss.Operators, wss.Operators_Per_Machine,
  --wso.Last_Updated wsoLastUpdated, wss.Last_Updated wssLastUpdated,
  wss.Shift_ID standardShiftID, wso.Shift_ID overrideShiftID, s.[Shift] shiftID
from 
  [Production].[dbo].[WCShift_Standard] wss
  inner join [Production].[dbo].[WCShift_Override] wso on wss.WorkCenter_OID = wso.WorkCenter_OID
  inner join [Production].[dbo].[Work_Center] wc on wss.WorkCenter_OID = wc.ObjectID
  inner join [Production].[dbo].[Shift] s on s.Shift = wss.Shift_ID
  inner join [Production].[dbo].[Shift_Override] so on wso.Shift_ID = so.ObjectID
where 1=1
  and wc.ObjectID = '8EE4B90E-7224-4A71-BE5E-C6A713AECF59' -- marumatsu
--  and s.Shift_Name = 'FIRST'
  --and wc.Work_Center = 'MARUMATSU'
  --and convert(varchar, wso.date, 1) = convert(varchar, getdate()-2, 1)
  and wso.date = '2022-01-03'
order by 
  wso.date desc
;


-- get override start/stop times
select top 10
  --wc.Department, 
  wc.Work_Center, 
  s.Shift_Name, 
  cast(wso.date as date) OverrideDate, 
  cast(sd.Start_Time as time) start, 
  cast(sd.End_Time as time) stop, 
  wso.Is_Work_Day OverrideIsWorkDay 
  --wso.Hours OverrideHours, 
  --wc.Setup_Labor_Rate, wc.Run_Labor_Rate,
  --wss.Machines, wss.Operators, wss.Operators_Per_Machine,
  --wso.Last_Updated wsoLastUpdated, wss.Last_Updated wssLastUpdated,
  --wss.Shift_ID wssShiftID, wso.Shift_ID wsoShiftID, s.[Shift] sShiftID
from
  [Production].[dbo].[WCShift_Standard] wss
  inner join [Production].[dbo].[WCShift_Override] wso on wss.WorkCenter_OID = wso.WorkCenter_OID
  inner join [Production].dbo.Work_Center wc on wss.WorkCenter_OID = wc.ObjectID
  inner join Production.dbo.[Shift] s on s.[Shift] = wss.Shift_ID
  inner join production.dbo.Shift_Day sd on s.Shift = sd.Shift
  --inner join production.dbo.Shift_Override so on wso.Shift_ID = so.ObjectID
where 1=1
  and s.Shift_Name = 'FIRST'
  --and wc.ObjectID = '8EE4B90E-7224-4A71-BE5E-C6A713AECF59' -- marumatsu
  and wc.Work_Center = 'Marumatsu'
  --and cast(wso.date as date) = '2022-01-01' -- holiday
  and cast(wso.date as date) = '2022-01-15' -- work saturday
  --and sd.[Sequence] = (@@datefirst - 1 + datepart(weekday, wso.date)) % 7
  and sd.[Sequence] = 5
--order by 
--  wso.Last_Updated desc;

