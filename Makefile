.PHONY: all list release templates version


VERSION := $(shell node -p -e "require('./package.json').version")
MAINTAINER := $(shell head -n 1 MAINTAINER.md)


all: list

list:
	@grep '^\.PHONY' Makefile | cut -d' ' -f2- | tr ' ' '\n'

release:
	git checkout master && git pull origin && git fetch -p
	git log --pretty=format:"%C(yellow)%h%Creset %s%Cgreen%d" --reverse -20
	@echo "Releasing v$(VERSION) in 10 seconds. Press <CTRL+C> to abort" && sleep 10
	git commit -a -m 'v$(VERSION)' && git tag -a v$(VERSION) -m 'v$(VERSION)'
	git push --follow-tags

templates:
	sed -i -E "s/@(\w*)/@$(MAINTAINER)/" .github/issue_template.md
	sed -i -E "s/@(\w*)/@$(MAINTAINER)/" .github/pull_request_template.md

version:
	@echo $(VERSION)
