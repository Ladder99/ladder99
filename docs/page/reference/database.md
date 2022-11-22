# Database

## Data Model

The database is made up of user-facing views and their underlying tables -

Views (in the **public** schema):
- **devices** - a list of available devices
- **dataitems** - a list of all device dataitems
- **history_all** - history containing both text and numeric values
- **history_text** - history with only text values
- **history_float** - history with only numeric values

Tables (in the **raw** schema):
- **nodes** - stores device and dataitem definitions
- **edges** - will store connections between nodes
- **history** - stores historical values for dataitems
- **meta** - stores database version information

