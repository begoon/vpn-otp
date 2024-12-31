all: build install

build:
	deno compile -A --env=$(HOME)/.ssh/vpn.env -o ivpn main.ts

install:
	mv ivpn $(HOME)/bin

clean:
	git clean -xdf