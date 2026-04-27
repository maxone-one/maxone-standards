# maxone-standards — Audit-Tools installieren

.PHONY: install-tools audit audit-local check-tools

# Tools für Standards 022 (gitleaks) und 023 (semgrep)
install-tools:
	@echo "→ Installing gitleaks (Standard 022)..."
	@command -v gitleaks >/dev/null 2>&1 || { \
		echo "  gitleaks fehlt. Installation:"; \
		echo "    macOS:    brew install gitleaks"; \
		echo "    Linux:    curl -sSfL https://raw.githubusercontent.com/gitleaks/gitleaks/master/install.sh | sh"; \
		echo "    Go:       go install github.com/gitleaks/gitleaks/v8@latest"; \
		echo "    Windows:  scoop install gitleaks   ODER   choco install gitleaks"; \
		exit 1; \
	}
	@gitleaks version
	@echo ""
	@echo "→ Installing semgrep (Standard 023)..."
	@command -v semgrep >/dev/null 2>&1 || { \
		echo "  semgrep fehlt. Installation:"; \
		echo "    pip:      pip install semgrep"; \
		echo "    macOS:    brew install semgrep"; \
		echo "    Docker:   alias semgrep='docker run --rm -v \"\$$(pwd):/src\" returntocorp/semgrep semgrep'"; \
		exit 1; \
	}
	@semgrep --version
	@echo ""
	@echo "✓ Beide Tools verfügbar."

check-tools:
	@command -v gitleaks >/dev/null 2>&1 && echo "✓ gitleaks $$(gitleaks version 2>/dev/null)" || echo "✗ gitleaks fehlt — make install-tools"
	@command -v semgrep >/dev/null 2>&1 && echo "✓ semgrep $$(semgrep --version 2>/dev/null)" || echo "✗ semgrep fehlt — make install-tools"

audit:
	node scripts/audit.mjs

audit-local:
	node scripts/audit.mjs --local-only
