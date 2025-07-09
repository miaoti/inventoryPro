# Alert Re-evaluation When User Thresholds Change

## Overview

When a user's alert thresholds are updated through the User Management interface, the system now automatically re-evaluates all existing alerts to ensure they reflect the new threshold settings.

## How It Works

### 1. Threshold Update Detection
- When an Owner updates a user's `warningThreshold` or `criticalThreshold` in the User Management page
- The system detects if these values have actually changed from their previous values
- Only triggers re-evaluation if thresholds genuinely changed

### 2. Alert Re-evaluation Process
The system performs the following steps:

#### Step 1: Find Relevant Alerts
- Retrieves all **unresolved** alerts (both active and ignored, but NOT resolved alerts)
- Filters alerts to only include items that the user has access to based on their role and department:
  - **OWNER**: Can see alerts for all items
  - **ADMIN**: Can see alerts for their department + public items  
  - **USER**: Can see alerts for public items only

#### Step 2: Recalculate Alert Severity
For each relevant alert:
- Uses the user's **new** threshold percentages
- Calculates new warning and critical threshold values based on the item's safety stock
- Determines what the alert type should be with the new thresholds:
  - **CRITICAL_STOCK**: Current inventory ≤ critical threshold
  - **WARNING_STOCK**: Critical threshold < current inventory ≤ warning threshold
  - **NORMAL_STOCK**: Current inventory > warning threshold (should be ignored)

#### Step 3: Update Alert Status
- **Alert Type Changes**: Updates the alert type and message if severity changed
- **Move to Ignored**: If inventory is now above warning threshold, moves alert to ignored section
- **Move to Active**: If inventory was ignored but now below warning threshold, moves back to active section
- **No Change**: Leaves alert unchanged if new evaluation matches current status

## Example Scenarios

### Scenario 1: Lowering Thresholds
- **Before**: User has Warning=100%, Critical=50% 
- **After**: User changes to Warning=80%, Critical=30%
- **Result**: Some items that were "normal" might now trigger warning alerts, some warning alerts might become critical

### Scenario 2: Raising Thresholds  
- **Before**: User has Warning=80%, Critical=30%
- **After**: User changes to Warning=100%, Critical=50%
- **Result**: Some critical alerts might become warnings, some alerts might move to ignored section

### Scenario 3: Department-Specific Impact
- **Admin User**: Only alerts for items in their department (+ public items) are re-evaluated
- **Owner User**: All alerts in the system are re-evaluated based on the new thresholds

## Technical Implementation

### Backend Changes
1. **AlertService.reevaluateAlertsForUserThresholds()**: New method that performs the re-evaluation logic
2. **UserManagementService.updateUser()**: Enhanced to detect threshold changes and trigger re-evaluation
3. **Database**: No schema changes required - uses existing alert fields

### Frontend Changes
1. **User Management Page**: Now displays and allows editing of warning/critical thresholds
2. **Alert Types**: Updated to include threshold fields in user interfaces
3. **Threshold Display**: Shows current threshold values in the user table

## Benefits

1. **Consistency**: Alerts always reflect current user threshold preferences
2. **Real-time Updates**: No need to wait for new inventory changes to see updated alert classifications
3. **Department Awareness**: Only re-evaluates alerts the user can actually see/manage
4. **Audit Trail**: Alert messages are updated to indicate they were "evaluated with updated thresholds"

## Logging and Debugging

The system provides detailed console logging during re-evaluation:
- User information and new thresholds
- Number of alerts found and filtered
- Individual alert evaluation details
- Summary of changes made (updated, moved to ignored, moved to active)

This ensures transparency and helps with troubleshooting threshold-related issues. 