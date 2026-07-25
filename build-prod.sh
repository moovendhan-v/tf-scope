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
echo -e "${BLUE}${BOLD}       TFScope VS Code Production Packager       ${NC}"
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

# 2. Package the Extension
echo -e "\n${BLUE}[2/3] Building and Packaging Extension to VSIX...${NC}"
echo -e "${YELLOW}Running production build and packaging...${NC}"
# vsce package will trigger vscode:prepublish automatically
npx --yes @vscode/vsce package --allow-missing-repository

VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -n 1)

if [ -z "$VSIX_FILE" ]; then
    echo -e "${RED}❌ Failed to locate the packaged VSIX file.${NC}"
    exit 1
fi

VSIX_FILENAME=$(basename "$VSIX_FILE")
echo -e "${GREEN}✓ Packaged successfully: ${BOLD}${VSIX_FILENAME}${NC}"

# 3. Detect and Install the Extension in VS Code
echo -e "\n${BLUE}[3/3] Installing the Extension in VS Code...${NC}"

INSTALLED=false

if command -v code &> /dev/null; then
    echo -e "${GREEN}✓ VS Code CLI detected.${NC}"
    echo -e "${GREEN}🚀 Installing extension to VS Code...${NC}"
    code --install-extension "$VSIX_FILENAME" --force
    INSTALLED=true
    LAUNCH_CMD="code"
fi

if command -v code-insiders &> /dev/null; then
    echo -e "${GREEN}✓ VS Code Insiders CLI detected.${NC}"
    echo -e "${GREEN}🚀 Installing extension to VS Code Insiders...${NC}"
    code-insiders --install-extension "$VSIX_FILENAME" --force
    INSTALLED=true
    LAUNCH_CMD="code-insiders"
fi

if [ "$INSTALLED" = false ]; then
    echo -e "${RED}⚠️  VS Code CLI ('code' or 'code-insiders') not found in PATH.${NC}"
    echo -e "${YELLOW}To enable launching or installing from terminal:${NC}"
    echo -e "  1. Open VS Code."
    echo -e "  2. Open the Command Palette (Cmd+Shift+P)."
    echo -e "  3. Search for: ${BOLD}Shell Command: Install 'code' command in PATH${NC}"
    echo -e "  4. Restart your terminal and run this script again."
    echo -e "\n${BLUE}You can also install the VSIX manually:${NC}"
    echo -e "  - In VS Code, open Extensions tab (Cmd+Shift+X)."
    echo -e "  - Click on the '...' menu in the top right of the Extensions panel."
    echo -e "  - Choose 'Install from VSIX...' and select ${BOLD}${VSIX_FILENAME}${NC}"
else
    echo -e "\n${GREEN}${BOLD}✓ Extension installed successfully!${NC}"
    echo -e "${GREEN}🎉 You can now open any folder with Terraform files in VS Code and use TFScope!${NC}"
    echo -e "${GREEN}🚀 Launching VS Code...${NC}"
    $LAUNCH_CMD .
fi

echo -e "\n${GREEN}${BOLD}Done!${NC}\n"
