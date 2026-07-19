#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}==================================================${NC}"
echo -e "${BLUE}${BOLD}       TFScope VS Code Extension Builder          ${NC}"
echo -e "${BLUE}${BOLD}==================================================${NC}"

# Ensure we are in the script directory
cd "$(dirname "$0")"

# 1. Dependency Check
echo -e "\n${BLUE}[1/3] Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing root dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✓ Root dependencies already installed.${NC}"
fi

if [ ! -d "webview-ui/node_modules" ]; then
    echo -e "${YELLOW}Installing Webview UI dependencies...${NC}"
    cd webview-ui && npm install && cd ..
else
    echo -e "${GREEN}✓ Webview UI dependencies already installed.${NC}"
fi

# 2. Build the Extension and Webview
echo -e "\n${BLUE}[2/3] Building the extension and webview...${NC}"
echo -e "${YELLOW}Running production build...${NC}"
npm run vscode:prepublish
echo -e "${GREEN}✓ Build completed successfully!${NC}"

# 3. Detect and Launch VS Code
echo -e "\n${BLUE}[3/3] Launching VS Code with the extension...${NC}"

LAUNCH_PATH="$(pwd)"

if command -v code &> /dev/null; then
    echo -e "${GREEN}✓ VS Code CLI detected.${NC}"
    echo -e "${GREEN}🚀 Launching VS Code Extension Development Host...${NC}"
    code --extensionDevelopmentPath="$LAUNCH_PATH" .
elif command -v code-insiders &> /dev/null; then
    echo -e "${GREEN}✓ VS Code Insiders CLI detected.${NC}"
    echo -e "${GREEN}🚀 Launching VS Code Insiders Extension Development Host...${NC}"
    code-insiders --extensionDevelopmentPath="$LAUNCH_PATH" .
else
    echo -e "${RED}⚠️  VS Code CLI ('code' or 'code-insiders') not found in PATH.${NC}"
    echo -e "${YELLOW}To enable launching from terminal:${NC}"
    echo -e "  1. Open VS Code."
    echo -e "  2. Open the Command Palette (Cmd+Shift+P)."
    echo -e "  3. Search for: ${BOLD}Shell Command: Install 'code' command in PATH${NC}"
    echo -e "  4. Restart your terminal and run this script again."
    echo -e "\n${BLUE}For now, you can open this project folder in VS Code and press F5.${NC}"
fi

echo -e "\n${GREEN}${BOLD}Done!${NC}\n"
