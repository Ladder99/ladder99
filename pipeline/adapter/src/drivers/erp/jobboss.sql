-- wip queries


-- wc schedule
select top 10
  s.Shift_Name, wc.Work_Center, wso.date OverrideDate, 
  --wso.Hours OverrideHours, 
  wso.Is_Work_Day OverrideIsWorkDay, wc.Department, 
  --wc.Setup_Labor_Rate, wc.Run_Labor_Rate,
  --wss.Machines, wss.Operators, wss.Operators_Per_Machine,
  --wso.Last_Updated wsoLastUpdated, wss.Last_Updated wssLastUpdated,
  wss.Shift_ID wssShiftID, wso.Shift_ID wsoShiftID, s.[Shift] sShiftID
from 
  [Production].[dbo].[WCShift_Standard] wss
  inner join [Production].[dbo].[WCShift_Override] wso on wss.WorkCenter_OID = wso.WorkCenter_OID
  inner join [Production].dbo.Work_Center wc on wss.WorkCenter_OID = wc.ObjectID
  inner join Production.dbo.[Shift] s on s.[Shift] = wss.Shift_ID
  inner join production.dbo.Shift_Override so on wso.Shift_ID = so.ObjectID
where 
  wc.ObjectID = '8EE4B90E-7224-4A71-BE5E-C6A713AECF59' -- marumatsu
order by 
  wso.Last_Updated desc
;

-- shift default times (year=1899)
select
  s.Shift_Name, sd.Start_Time, sd.End_Time, sd.[Sequence] 
from 
  [Shift] s
  inner join Shift_Day sd on s.[Shift] = sd.[Shift]
  --inner join Shift_Override so on sd.[Shift] = so.ObjectID
order by 
  s.Shift_Name, sd.Sequence 
;


-- This should return a result of 0 records for today if there are no 
-- overrides for today. If a record is returned then there is an override 
-- for the day and we need to use that. 
select top 10
  s.Shift_Name, wc.Work_Center, wso.date OverrideDate, wso.Hours OverrideHours, 
  wso.Is_Work_Day OverrideIsWorkDay, wc.Department, 
  --wc.Setup_Labor_Rate, wc.Run_Labor_Rate,
  --wss.Machines, wss.Operators, wss.Operators_Per_Machine,
  --wso.Last_Updated wsoLastUpdated, wss.Last_Updated wssLastUpdated,
  wss.Shift_ID wssShiftID, wso.Shift_ID wsoShiftID, s.[Shift] sShiftID
from 
  [Production].[dbo].[WCShift_Standard] wss
  inner join [Production].[dbo].[WCShift_Override] wso on wss.WorkCenter_OID = wso.WorkCenter_OID
  inner join [Production].dbo.Work_Center wc on wss.WorkCenter_OID = wc.ObjectID
  inner join Production.dbo.[Shift] s on s.[Shift] = wss.Shift_ID
  inner join production.dbo.Shift_Override so on wso.Shift_ID = so.ObjectID
where 1=1
  and wc.ObjectID = '8EE4B90E-7224-4A71-BE5E-C6A713AECF59' -- marumatsu
  and s.Shift_Name = 'FIRST'
  --and wc.Work_Center = 'MARUMATSU'
  and convert(varchar, wso.date, 1) = convert(varchar, getdate()-2, 1)
order by 
  wso.Last_Updated desc
;



select top 10 * from shift_day;

select top 50 objectid, Shift_ID, hours, WorkCenter_OID from WCShift_Standard;

select top 20 work_center, type, note_text, parent_id from work_center;

select top 10 * from Shift_Override;
