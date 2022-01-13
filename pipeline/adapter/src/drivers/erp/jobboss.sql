-- wc schedule
-- check here for override entry for a machine and date, yes?
select top 10
  wc.Department, wc.Work_Center, s.Shift_Name, 
  wso.date OverrideDate, wso.Is_Work_Day OverrideIsWorkDay,  
  --wso.Hours OverrideHours, 
  --wc.Setup_Labor_Rate, wc.Run_Labor_Rate,
  --wss.Machines, wss.Operators, wss.Operators_Per_Machine,
  --wso.Last_Updated wsoLastUpdated, wss.Last_Updated wssLastUpdated,
  wss.Shift_ID standardShiftID, wso.Shift_ID overrideShiftID, s.[Shift] shiftID
from 
  [Production].[dbo].[WCShift_Standard] wss
  inner join [Production].[dbo].[WCShift_Override] wso on wss.WorkCenter_OID = wso.WorkCenter_OID
  inner join [Production].dbo.Work_Center wc on wss.WorkCenter_OID = wc.ObjectID
  inner join Production.dbo.[Shift] s on s.[Shift] = wss.Shift_ID
  inner join production.dbo.Shift_Override so on wso.Shift_ID = so.ObjectID
where 
  wc.ObjectID = '8EE4B90E-7224-4A71-BE5E-C6A713AECF59' -- marumatsu
  and wso.date = '2022-01-08'
order by 
  wso.Last_Updated desc
;

-- shift default times (year=1899) for day of week
select
  s.Shift_Name, sd.[Sequence], sd.Start_Time, sd.End_Time 
from 
  [Shift] s
  inner join Shift_Day sd on s.[Shift] = sd.[Shift]
  --inner join Shift_Override so on sd.[Shift] = so.ObjectID
where
  shift_name = 'FIRST'
  and sequence = 2
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
  inner join [Production].dbo.Work_Center wc on wss.WorkCenter_OID = wc.ObjectID
  inner join Production.dbo.[Shift] s on s.[Shift] = wss.Shift_ID
  inner join production.dbo.Shift_Override so on wso.Shift_ID = so.ObjectID
where 1=1
  and wc.ObjectID = '8EE4B90E-7224-4A71-BE5E-C6A713AECF59' -- marumatsu
--  and s.Shift_Name = 'FIRST'
  --and wc.Work_Center = 'MARUMATSU'
  --and convert(varchar, wso.date, 1) = convert(varchar, getdate()-2, 1)
  and wso.date = '2022-01-08'
order by 
  --wso.Last_Updated desc
  wso.date desc
;

select convert(varchar, '2022-01-13', 1); -- '2022-01-13'

select datepart(weekday, '2022-01-13'); -- 5=thurs, so sun=1 - subtract 1

--select datefirst;

select top 10 * from shift_day;

select top 50 objectid, Shift_ID, hours, WorkCenter_OID from WCShift_Standard;

select top 20 work_center, type, note_text, parent_id from work_center;

select top 10 * from Shift_Override;
