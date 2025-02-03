#!/bin/bash

# Set the output file name with a timestamp
OUTPUT_FILE="git_diff_$(date +%Y%m%d_%H%M%S).txt"

# Capture both unstaged and staged changes
{
    echo "### Unstaged Changes ###"
    git diff
    echo -e "\n### Staged Changes ###"
    git diff --staged
} > "$OUTPUT_FILE"

# Check if the file has content
if [ -s "$OUTPUT_FILE" ]; then
    echo "Git diff saved to $OUTPUT_FILE"
else
    echo "No changes detected in git diff."
    rm "$OUTPUT_FILE"  # Remove empty file
fi
