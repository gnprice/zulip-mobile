# Some `jq` functions for processing Flow output.
#
# General usage:
#   $ npx flow --json | jq -L tools '
#       include "flow";
#       # ... then use any of these functions
#       '

# Extract and parse the output from $Flow$DebugPrint.
# Usage:
#   // in js:
#   declare var flowdebug: $Flow$DebugPrint; // any name you like; but type is special
#   flowdebug(/* some expression */)
#
#   $ npx flow --json | jq -L tools 'include "flow"; descrs'
def descrs:
  .errors[] | .message[0].descr | try fromjson;

# Mostly an internal helper.  Shorten a source location, from 12 lines to 1.
# A bit crude; might be nice to collapse equal start/end lines.
def shorten_pos:
  "\(.source):\(.start.line)-\(.end.line):\(.start.column)-\(.end.column)";

# Mostly an internal helper.  Shorten a "reason", from 15 lines to 1.
def shorten_reason:
  "\(.desc) at \(.pos | shorten_pos)";

# Make verbose details more compact.
# Sample usage:
#   descrs | shorten
def shorten:
  if type != "object" and type != "array"
  then .
  else if type == "object" and .reason
       then .reason |= shorten_reason
       else . end
       | map_values(shorten)
  end;
