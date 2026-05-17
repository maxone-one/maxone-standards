<!--
  Footer-Standard 012 — Svelte/SvelteKit
  Destilliert aus maxone.one/src/lib/components/shared/Footer.svelte
-->

<script lang="ts">
  // <PROJEKT_BRAND> = Anzeige-Name (z.B. "MaxOne")
  // <BESCHREIBUNG> = 1-2 Sätze
  const navLinks: Array<{ href: string; label: string }> = [
    // { href: '/produkt', label: 'Produkt' },
  ];

  const year = new Date().getFullYear();
</script>

<footer class="py-12 md:py-16 border-t border-border">
  <div class="container px-4 md:px-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
      <!-- Brand -->
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-foreground"><!-- PROJEKT_BRAND --></span>
        </div>
        <p class="text-sm text-muted-foreground leading-relaxed">
          <!-- BESCHREIBUNG -->
        </p>
        <div class="flex items-center gap-2 pt-2">
          <svg class="w-5 h-4 rounded-sm overflow-hidden flex-shrink-0" viewBox="0 0 20 16" aria-label="Made in Germany">
            <rect y="0" width="20" height="5.33" fill="#000" />
            <rect y="5.33" width="20" height="5.33" fill="#DD0000" />
            <rect y="10.67" width="20" height="5.33" fill="#FFCC00" />
          </svg>
          <span class="text-xs text-muted-foreground">Gehostet in Deutschland</span>
        </div>
      </div>

      <!-- Navigation -->
      <div>
        <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Produkt</h3>
        <nav class="flex flex-col space-y-2.5">
          {#each navLinks as link}
            <a href={link.href} class="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </a>
          {/each}
        </nav>
      </div>

      <!-- Rechtliches -->
      <div>
        <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Rechtliches</h3>
        <nav class="flex flex-col space-y-2.5">
          <a href="/impressum" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Impressum</a>
          <a href="/datenschutz" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Datenschutz</a>
          <button
            type="button"
            on:click={() => { localStorage.removeItem('cookie_consent'); location.reload(); }}
            class="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
          >
            Cookie-Einstellungen
          </button>
        </nav>
      </div>
    </div>

    <div class="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
      <span>© {year} <!-- PROJEKT_BRAND --></span>
      <span class="flex items-center gap-3">
        <a
          href="https://maxone.one"
          target="_blank"
          rel="noreferrer noopener"
          class="opacity-50 hover:opacity-80 transition-opacity"
        >
          Entwickelt von maxone
        </a>
        <!-- Version-Marker (Standard 042): PUBLIC_BUILD_ID via $env/static/public -->
        <!-- {#if buildId && buildId !== 'dev'} -->
        <!--   <a href="https://github.com/maxone-one/REPO/commit/{buildId}" -->
        <!--      target="_blank" rel="noopener noreferrer" -->
        <!--      class="font-mono opacity-30 hover:opacity-60 transition-opacity"> -->
        <!--     v: {buildId.slice(0, 8)} -->
        <!--   </a> -->
        <!-- {/if} -->
      </span>
    </div>
  </div>
</footer>

<style>
  @media print {
    footer { display: none !important; }
  }
</style>
