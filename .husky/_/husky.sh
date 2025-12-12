#!/bin/sh

if [ -z "$husky_skip_init" ]; then
  if [ "$1" = "--version" ]; then
    echo "9.0.0"
    exit 0
  fi
  readonly husky_skip_init=1
  export husky_skip_init
  sh -e "$0" "$@"
  exit $?
fi

if [ -n "$husky_skip_init" ]; then
  return
fi

command_exists () {
  command -v "$1" >/dev/null 2>&1
}

husky_has_hook_env () {
  [ -n "$HUSKY" ]
}

husky_skip_if_chain_split () {
  case $- in
    *e*) return 0 ;;
    *)   return 1 ;;
  esac
}

if ! command_exists npm; then
  echo "Husky requires npm to run hooks"
  exit 1
fi

if husky_skip_if_chain_split; then
  npm --silent run husky || exit $?
fi
