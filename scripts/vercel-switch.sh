#!/bin/bash

# Vercel Account Manager for macOS
# Author: Nam Viet ERP Team
# Version: 1.0.0

ACCOUNTS_DIR="$HOME/.vercel-accounts"
AUTH_FILE="$HOME/.vercel/auth.json"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Emojis
CHECK="✅"
CROSS="❌"
INFO="ℹ️"
ROCKET="🚀"
LIST="📋"
SAVE="💾"
USER="👤"

# Function: List available accounts
list_accounts() {
    echo -e "${BLUE}${LIST} Available Vercel Accounts:${NC}"

    if [ ! -d "$ACCOUNTS_DIR" ] || [ -z "$(ls -A $ACCOUNTS_DIR 2>/dev/null)" ]; then
        echo -e "${YELLOW}${INFO} No saved accounts found.${NC}"
        echo -e "   Run: ${GREEN}vercel-switch save <account-name>${NC} to save an account"
        return
    fi

    echo ""
    ls -1 $ACCOUNTS_DIR 2>/dev/null | sed 's/auth-//g' | sed 's/.json//g' | while read account; do
        echo -e "   ${GREEN}•${NC} $account"
    done
    echo ""
}

# Function: Switch account
switch_account() {
    local account_name=$1

    if [ -z "$account_name" ]; then
        echo -e "${RED}${CROSS} Error: Account name required${NC}"
        echo -e "   Usage: vercel-switch switch <account-name>"
        return 1
    fi

    local account_file="$ACCOUNTS_DIR/auth-$account_name.json"

    if [ -f "$account_file" ]; then
        # Backup current auth if exists
        if [ -f "$AUTH_FILE" ]; then
            cp "$AUTH_FILE" "$AUTH_FILE.backup"
        fi

        # Switch to new account
        cp "$account_file" "$AUTH_FILE"
        echo -e "${GREEN}${CHECK} Switched to: $account_name${NC}"
        echo ""
        vercel whoami 2>/dev/null || echo -e "${YELLOW}${INFO} Not logged in or invalid token${NC}"
    else
        echo -e "${RED}${CROSS} Account not found: $account_name${NC}"
        echo ""
        list_accounts
        return 1
    fi
}

# Function: Save current account
save_account() {
    local account_name=$1

    if [ -z "$account_name" ]; then
        echo -e "${RED}${CROSS} Error: Account name required${NC}"
        echo -e "   Usage: vercel-switch save <account-name>"
        return 1
    fi

    if [ ! -f "$AUTH_FILE" ]; then
        echo -e "${RED}${CROSS} Error: No Vercel credentials found${NC}"
        echo -e "   Please run: ${GREEN}vercel login${NC} first"
        return 1
    fi

    local account_file="$ACCOUNTS_DIR/auth-$account_name.json"

    mkdir -p "$ACCOUNTS_DIR"
    cp "$AUTH_FILE" "$account_file"
    echo -e "${GREEN}${SAVE} Saved current account as: $account_name${NC}"
    echo ""
    vercel whoami 2>/dev/null
}

# Function: Show current account
show_current() {
    echo -e "${BLUE}${USER} Current Vercel Account:${NC}"
    echo ""

    if [ ! -f "$AUTH_FILE" ]; then
        echo -e "${YELLOW}${INFO} Not logged in${NC}"
        echo -e "   Run: ${GREEN}vercel login${NC} to login"
        return
    fi

    vercel whoami 2>/dev/null || echo -e "${YELLOW}${INFO} Not logged in or invalid token${NC}"
}

# Function: Delete saved account
delete_account() {
    local account_name=$1

    if [ -z "$account_name" ]; then
        echo -e "${RED}${CROSS} Error: Account name required${NC}"
        echo -e "   Usage: vercel-switch delete <account-name>"
        return 1
    fi

    local account_file="$ACCOUNTS_DIR/auth-$account_name.json"

    if [ -f "$account_file" ]; then
        rm "$account_file"
        echo -e "${GREEN}${CHECK} Deleted account: $account_name${NC}"
    else
        echo -e "${RED}${CROSS} Account not found: $account_name${NC}"
        list_accounts
        return 1
    fi
}

# Function: Rename account
rename_account() {
    local old_name=$1
    local new_name=$2

    if [ -z "$old_name" ] || [ -z "$new_name" ]; then
        echo -e "${RED}${CROSS} Error: Both old and new names required${NC}"
        echo -e "   Usage: vercel-switch rename <old-name> <new-name>"
        return 1
    fi

    local old_file="$ACCOUNTS_DIR/auth-$old_name.json"
    local new_file="$ACCOUNTS_DIR/auth-$new_name.json"

    if [ ! -f "$old_file" ]; then
        echo -e "${RED}${CROSS} Account not found: $old_name${NC}"
        list_accounts
        return 1
    fi

    mv "$old_file" "$new_file"
    echo -e "${GREEN}${CHECK} Renamed: $old_name → $new_name${NC}"
}

# Function: Deploy with specific account
deploy_with_account() {
    local account_name=$1
    shift  # Remove first argument, keep the rest for vercel command

    if [ -z "$account_name" ]; then
        echo -e "${RED}${CROSS} Error: Account name required${NC}"
        echo -e "   Usage: vercel-switch deploy <account-name> [vercel-args]"
        return 1
    fi

    # Switch to account
    switch_account "$account_name" || return 1

    echo ""
    echo -e "${ROCKET} Deploying with account: ${GREEN}$account_name${NC}"
    echo ""

    # Run vercel command with remaining arguments
    vercel "$@"
}

# Function: Show help
show_help() {
    echo -e "${BLUE}Vercel Account Manager${NC}"
    echo ""
    echo "Usage: vercel-switch <command> [arguments]"
    echo ""
    echo "Commands:"
    echo -e "  ${GREEN}list${NC}                          List all saved accounts"
    echo -e "  ${GREEN}save${NC} <account-name>           Save current logged-in account"
    echo -e "  ${GREEN}switch${NC} <account-name>         Switch to a saved account"
    echo -e "  ${GREEN}current${NC}                       Show current account"
    echo -e "  ${GREEN}delete${NC} <account-name>         Delete a saved account"
    echo -e "  ${GREEN}rename${NC} <old> <new>            Rename a saved account"
    echo -e "  ${GREEN}deploy${NC} <account> [args]       Deploy with specific account"
    echo -e "  ${GREEN}help${NC}                          Show this help message"
    echo ""
    echo "Examples:"
    echo -e "  ${YELLOW}# Setup${NC}"
    echo "  vercel login                    # Login to first account"
    echo "  vercel-switch save personal     # Save as 'personal'"
    echo "  vercel login                    # Login to second account"
    echo "  vercel-switch save company      # Save as 'company'"
    echo ""
    echo -e "  ${YELLOW}# Daily use${NC}"
    echo "  vercel-switch list              # Show all accounts"
    echo "  vercel-switch switch personal   # Switch to personal"
    echo "  vercel-switch current           # Show current account"
    echo ""
    echo -e "  ${YELLOW}# Deploy${NC}"
    echo "  vercel-switch deploy personal --prod"
    echo "  vercel-switch deploy company"
    echo ""
}

# Main
case "$1" in
    list|ls)
        list_accounts
        ;;
    switch|sw)
        switch_account "$2"
        ;;
    save)
        save_account "$2"
        ;;
    current|whoami)
        show_current
        ;;
    delete|rm)
        delete_account "$2"
        ;;
    rename|mv)
        rename_account "$2" "$3"
        ;;
    deploy)
        deploy_with_account "$2" "${@:3}"
        ;;
    help|-h|--help)
        show_help
        ;;
    "")
        show_help
        ;;
    *)
        echo -e "${RED}${CROSS} Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
