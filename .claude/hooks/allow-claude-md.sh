#!/bin/bash
FILE_PATH=$(jq -r '.tool_input.file_path // empty')
if echo "$FILE_PATH" | grep -qiE 'CLAUDE\.md$|/\.claude/(agents|commands)/'; then
  echo '{"hookSpecificOutput":{"hookEventName":"PermissionRequest","decision":{"behavior":"allow"}}}'
fi
exit 0
