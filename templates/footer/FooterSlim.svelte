<!--
  Footer-Standard 012 — Slim-Variante, SvelteKit

  Anwenden:
  1. PROJEKT_BRAND  — Anzeige-Name ("stadtpunkt", "katchi", …)
  2. PROJEKT_REPO   — GitHub-Repo-Slug bei github.com/maxone-one
  3. PUBLIC_BUILD_ID via $env/static/public einbinden (siehe Kommentar)

  Wann Slim: Platzhalter-Seiten, Login-Flows, App-Bereiche.
  Wann Mega: vollwertige Seiten → Footer.svelte nutzen.
-->

<script lang="ts">
  // Version-Marker (Standard 042) — SvelteKit-Weg:
  // import { PUBLIC_BUILD_ID } from '$env/static/public';
  // const buildId = PUBLIC_BUILD_ID;
  //
  // Dockerfile: ARG PUBLIC_BUILD_ID / ENV PUBLIC_BUILD_ID=${PUBLIC_BUILD_ID}
  // Build-Arg:  PUBLIC_BUILD_ID=${GITHUB_SHA}

  const buildId = ""; // TODO: aus $env/static/public
  const year = new Date().getFullYear();
</script>

<footer class="border-t border-border mt-auto">
  <div class="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
    <span class="flex items-center flex-wrap gap-x-3 gap-y-1">
      <span>© {year} <!-- PROJEKT_BRAND --></span>
      <span class="opacity-30">·</span>
      <a href="/impressum" class="hover:text-foreground transition-colors">Impressum</a>
      <span class="opacity-30">·</span>
      <a href="/datenschutz" class="hover:text-foreground transition-colors">Datenschutz</a>
      <!-- Optional: weitere Legal-Links -->
    </span>
    <span class="flex items-center gap-3">
      <a
        href="https://maxone.one"
        target="_blank"
        rel="noopener noreferrer"
        class="opacity-50 hover:opacity-80 transition-opacity"
      >
        Entwickelt von maxone
      </a>
      {#if buildId && buildId !== 'dev'}
        <a
          href={`https://github.com/maxone-one/REPO/commit/${buildId}`}
          target="_blank"
          rel="noopener noreferrer"
          class="font-mono opacity-30 hover:opacity-60 transition-opacity"
        >
          v: {buildId.slice(0, 8)}
        </a>
      {/if}
    </span>
  </div>
</footer>

<style>
  @media print { footer { display: none !important; } }
</style>
