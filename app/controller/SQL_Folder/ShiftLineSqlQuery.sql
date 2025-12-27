
select * from Calendar order by Date Desc
select * from ShiftLine order by ShiftId,ShiftSequence,OperationStartTime
select * from ShiftHeader
select * from SKUCategory

select * from SSPCSdbo.PatternShiftMapping
select * from ShiftLine order by ShiftId,ShiftSequence,OperationStartTime

delete from ShiftLine
delete from SKUCategory where SKUCategoryCode='P2-S-61632-CMPV-016'

insert into ShiftLine (ShiftId,ShiftSequence,OperationStartTime,OperationEndTime,CreatedBy,CreatedDate)
values (1,1,'05:50:00','07:20:00',1, GETDATE()),
(1,2,'07:40:00','09:50:00',1, GETDATE()),
(1,3,'10:00:00','12:30:00',1, GETDATE()),
(1,4,'13:00:00','14:45:00',1, GETDATE()),
(2,5,'15:00:00','17:00:00',1, GETDATE()),
(2,6,'17:10:00','19:20:00',1, GETDATE()),
(2,7,'19:50:00','22:00:00',1, GETDATE()),
(2,8,'22:10:00','23:45:00',1, GETDATE()),
(3,9,'00:00:00','01:45:00',1, GETDATE()),
(3,10,'02:15:00','04:00:00',1, GETDATE()),
(3,11,'04:10:00','05:35:00',1, GETDATE())




