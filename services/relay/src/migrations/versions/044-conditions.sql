-- Add `raw.conditions` table used for persisting conditions data (e.g. alarms, warnings)

-- Create the table
create table if not exists raw.conditions (
  time timestamptz primary key not null,  -- When condition was raised, the start time
  resolved_time timestamptz references raw.conditions(time),  -- When condition was cleared, otherwise `null` for still active conditions, the end time
  -- Note: We reference the `node_id` column of the `public.devices` view instead of `node_id` of `raw.nodes`, as in the view the nodes are filtered down to those items which have `nodes.props->>'node_type'` set to `Device`.
  node_id int references public.devices (nodes_id) not null,
  -- Note: We reference the `path` column of the `public.dataitems` view instead of `nodes.props->>'path'` of `raw.nodes`, as we cannot reference a JSONB property value and because in the view the nodes are filtered down to those items which have `nodes.props->>'node_type'` set to `Device`.
  dataitem_id int references public.dataitems (path) not null,
  state text check (state in ('Fault'::text, 'Normal'::text, 'Unavailable'::text, 'Warning'::text)) not null,  -- Tag name of the condition when it was raised
  type text not null check (type ~ '^x:.*' or type in ('ACCELERATION'::text, 'ACCUMULATED_TIME'::text, 'ACTIVATION_COUNT'::text, 'ACTIVE_AXES'::text, 'ACTIVE_POWER_SOURCE'::text, 'ACTUATOR'::text, 'ACTUATOR_STATE'::text, 'ADAPTER_SOFTWARE_VERSION'::text, 'ADAPTER_URI'::text, 'ALARM'::text, 'ALARM_LIMIT'::text, 'ALARM_LIMITS'::text, 'AMPERAGE'::text, 'AMPERAGE_AC'::text, 'AMPERAGE_DC'::text, 'ANGLE'::text, 'ANGULAR_ACCELERATION'::text, 'ANGULAR_DECELERATION'::text, 'ANGULAR_VELOCITY'::text, 'APPLICATION'::text, 'ASSET_CHANGED'::text, 'ASSET_COUNT'::text, 'ASSET_REMOVED'::text, 'ASSET_UPDATE_RATE'::text, 'AVAILABILITY'::text, 'AXIS_COUPLING'::text, 'AXIS_FEEDRATE'::text, 'AXIS_FEEDRATE_OVERRIDE'::text, 'AXIS_INTERLOCK'::text, 'AXIS_STATE'::text, 'BATTERY_CAPACITY'::text, 'BATTERY_CHARGE'::text, 'BATTERY_STATE'::text, 'BLOCK'::text, 'BLOCK_COUNT'::text, 'CAPACITY_FLUID'::text, 'CAPACITY_SPATIAL'::text, 'CHARACTERISTIC_PERSISTENT_ID'::text, 'CHARACTERISTIC_STATUS'::text, 'CHARGE_RATE'::text, 'CHUCK_INTERLOCK'::text, 'CHUCK_STATE'::text, 'CLOCK_TIME'::text, 'CODE'::text, 'COMMUNICATIONS'::text, 'COMPONENT_DATA'::text, 'COMPOSITION_STATE'::text, 'CONCENTRATION'::text, 'CONDUCTIVITY'::text, 'CONNECTION_STATUS'::text, 'CONTROLLER_MODE'::text, 'CONTROLLER_MODE_OVERRIDE'::text, 'CONTROL_LIMIT'::text, 'CONTROL_LIMITS'::text, 'COUPLED_AXES'::text, 'CUTTING_SPEED'::text, 'CYCLE_COUNT'::text, 'DATA_RANGE'::text, 'DATE_CODE'::text, 'DEACTIVATION_COUNT'::text, 'DECELERATION'::text, 'DENSITY'::text, 'DEPOSITION_ACCELERATION_VOLUMETRIC'::text, 'DEPOSITION_DENSITY'::text, 'DEPOSITION_MASS'::text, 'DEPOSITION_RATE_VOLUMETRIC'::text, 'DEPOSITION_VOLUME'::text, 'DEVICE_ADDED'::text, 'DEVICE_CHANGED'::text, 'DEVICE_REMOVED'::text, 'DEVICE_UUID'::text, 'DEW_POINT'::text, 'DIAMETER'::text, 'DIRECTION'::text, 'DISCHARGE_RATE'::text, 'DISPLACEMENT'::text, 'DISPLACEMENT_ANGULAR'::text, 'DISPLACEMENT_LINEAR'::text, 'DOOR_STATE'::text, 'ELECTRICAL_ENERGY'::text, 'EMERGENCY_STOP'::text, 'END_OF_BAR'::text, 'EQUIPMENT_MODE'::text, 'EQUIPMENT_TIMER'::text, 'EXECUTION'::text, 'FEATURE_MEASUREMENT'::text, 'FEATURE_PERSISTENT_ID'::text, 'FILL_LEVEL'::text, 'FIRMWARE'::text, 'FIXTURE_ID'::text, 'FLOW'::text, 'FOLLOWING_ERROR'::text, 'FOLLOWING_ERROR_ANGULAR'::text, 'FOLLOWING_ERROR_LINEAR'::text, 'FREQUENCY'::text, 'FUNCTIONAL_MODE'::text, 'GLOBAL_POSITION'::text, 'GRAVITATIONAL_ACCELERATION'::text, 'GRAVITATIONAL_FORCE'::text, 'HARDNESS'::text, 'HARDWARE'::text, 'HOST_NAME'::text, 'HUMIDITY_ABSOLUTE'::text, 'HUMIDITY_RELATIVE'::text, 'HUMIDITY_SPECIFIC'::text, 'INTERFACE_STATE'::text, 'LEAK_DETECT'::text, 'LENGTH'::text, 'LEVEL'::text, 'LIBRARY'::text, 'LINE'::text, 'LINEAR_FORCE'::text, 'LINE_LABEL'::text, 'LINE_NUMBER'::text, 'LOAD'::text, 'LOAD_COUNT'::text, 'LOCATION_ADDRESS'::text, 'LOCK_STATE'::text, 'LOGIC_PROGRAM'::text, 'MAINTENANCE_LIST'::text, 'MASS'::text, 'MATERIAL'::text, 'MATERIAL_LAYER'::text, 'MEASUREMENT_TYPE'::text, 'MEASUREMENT_UNITS'::text, 'MEASUREMENT_VALUE'::text, 'MESSAGE'::text, 'MOTION_PROGRAM'::text, 'MTCONNECT_VERSION'::text, 'NETWORK'::text, 'NETWORK_PORT'::text, 'OBSERVATION_UPDATE_RATE'::text, 'OPENNESS'::text, 'OPERATING_MODE'::text, 'OPERATING_SYSTEM'::text, 'OPERATOR_ID'::text, 'ORIENTATION'::text, 'PALLET_ID'::text, 'PART_COUNT'::text, 'PART_COUNT_TYPE'::text, 'PART_DETECT'::text, 'PART_GROUP_ID'::text, 'PART_ID'::text, 'PART_KIND_ID'::text, 'PART_NUMBER'::text, 'PART_PROCESSING_STATE'::text, 'PART_STATUS'::text, 'PART_UNIQUE_ID'::text, 'PATH_FEEDRATE'::text, 'PATH_FEEDRATE_OVERRIDE'::text, 'PATH_FEEDRATE_PER_REVOLUTION'::text, 'PATH_MODE'::text, 'PATH_POSITION'::text, 'PH'::text, 'POSITION'::text, 'POSITION_CARTESIAN'::text, 'POWER_FACTOR'::text, 'POWER_STATE'::text, 'POWER_STATUS'::text, 'PRESSURE'::text, 'PRESSURE_ABSOLUTE'::text, 'PRESSURIZATION_RATE'::text, 'PROCESS_AGGREGATE_ID'::text, 'PROCESS_KIND_ID'::text, 'PROCESS_OCCURRENCE_ID'::text, 'PROCESS_STATE'::text, 'PROCESS_TIME'::text, 'PROCESS_TIMER'::text, 'PROGRAM'::text, 'PROGRAM_COMMENT'::text, 'PROGRAM_EDIT'::text, 'PROGRAM_EDIT_NAME'::text, 'PROGRAM_HEADER'::text, 'PROGRAM_LOCATION'::text, 'PROGRAM_LOCATION_TYPE'::text, 'PROGRAM_NEST_LEVEL'::text, 'RESISTANCE'::text, 'ROTARY_MODE'::text, 'ROTARY_VELOCITY'::text, 'ROTARY_VELOCITY_OVERRIDE'::text, 'ROTATION'::text, 'SENSOR_ATTACHMENT'::text, 'SENSOR_STATE'::text, 'SERIAL_NUMBER'::text, 'SETTLING_ERROR'::text, 'SETTLING_ERROR_ANGULAR'::text, 'SETTLING_ERROR_LINEAR'::text, 'SOUND_LEVEL'::text, 'SPECIFICATION_LIMIT'::text, 'SPECIFICATION_LIMITS'::text, 'SPINDLE_INTERLOCK'::text, 'SPINDLE_SPEED'::text, 'STRAIN'::text, 'SYSTEM'::text, 'TEMPERATURE'::text, 'TENSION'::text, 'TILT'::text, 'TOOL_ASSET_ID'::text, 'TOOL_CUTTING_ITEM'::text, 'TOOL_GROUP'::text, 'TOOL_ID'::text, 'TOOL_NUMBER'::text, 'TOOL_OFFSET'::text, 'TOOL_OFFSETS'::text, 'TORQUE'::text, 'TRANSFER_COUNT'::text, 'TRANSLATION'::text, 'UNCERTAINTY'::text, 'UNCERTAINTY_TYPE'::text, 'UNLOAD_COUNT'::text, 'USER'::text, 'VALVE_STATE'::text, 'VARIABLE'::text, 'VELOCITY'::text, 'VISCOSITY'::text, 'VOLTAGE'::text, 'VOLTAGE_AC'::text, 'VOLTAGE_DC'::text, 'VOLT_AMPERE'::text, 'VOLT_AMPERE_REACTIVE'::text, 'VOLUME_FLUID'::text, 'VOLUME_SPATIAL'::text, 'WAIT_STATE'::text, 'WATTAGE'::text, 'WIRE'::text, 'WORKHOLDING_ID'::text, 'WORK_OFFSET'::text, 'WORK_OFFSETS'::text, 'X_DIMENSION'::text, 'Y_DIMENSION'::text, 'Z_DIMENSION'::text)),  -- Condition type
  condition_id text,
  native_code text,
  native_severity text,
  qualifier text check (qualifier in ('HIGH'::text, 'LOW'::text)),
  message text,  -- Value of the tag
  -- Columns `time`, `node_id`, `condition_id`, `dataitem_id` and `native_code` are used for condition uniqueness consideration, i.e. all of them together must be unique in the whole table
  unique(time, node_id, dataitem_id, condition_id, native_code),
  -- Make sure at least one of `condition_id` or `native_code` is defined
  constraint check_conditions_condition_id_or_native_code check (condition_id is not null or native_code is not null)
);

-- Create some extra indices
create index conditions_time_resolved_time_node_id_idx on raw.conditions using btree (time, resolved_time, node_id);
create index conditions_node_id_time_idx on raw.conditions using btree (node_id, time);

-- Create a view
create or replace view public.conditions as
  select
    rc.time,
    rc.resolved_time,
    pd.props->>'name' AS device,
    rc.path,
    rc.state,
    rc.type text,
    rc.native_code,
    rc.native_severity,
    rc.qualifier,
    message
  from raw.conditions rc
  join
    public.nodes as pd on rc.node_id = pd.node_id;
