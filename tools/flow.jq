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

# Internal helper for `shortloc`.
def shortloc_one:
  "\(.source):\(.start.line)-\(.end.line):\(.start.column)-\(.end.column)";

# Internal helper for `shortloc`.
def shortloc_pos:
  if type == "object" and .pos
  then .pos |= shortloc_one
  else . end;

# Compact the source locations to take 1 line each instead of 12.
# Sample usage:
#   descrs | shortloc
def shortloc:
  if type != "object" and type != "array"
  then .
  else shortloc_pos | map_values(shortloc) end;
