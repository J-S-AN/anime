$ErrorActionPreference = 'Stop'

$old = @'
<ul class="menu-links" id="menu-links">
                <li><a href="https://j-s-an.github.io/anime/">Início</a></li>
                <li><a href="https://j-s-an.github.io/anime/Lançamentos.html">Lançamentos</a></li>
                <li><a href="https://j-s-an.github.io/anime/lista-anime.html">Lista de Anime</a></li>
                <li><a href="https://j-s-an.github.io/anime/Pedido-de-Anime.html">Pedido de Anime</a></li>
            </ul>
'@

$new = @'
<ul class="menu-links" id="menu-links">
                <li><a href="https://j-s-an.github.io" style="color: #ff0000;">🏠 Início</a></li>
                <li><a href="https://j-s-an.github.io/calendario.html">📅 Calendário</a></li>
                <li><a href="https://j-s-an.github.io/Lançamentos.html">🎬 Lançamentos</a></li>
                <li><a href="https://j-s-an.github.io/em-breve.html">⏳ Em Breve</a></li>
                <li><a href="https://j-s-an.github.io/lista-anime.html">🔍 Lista de Anime</a></li>
                <li><a href="https://j-s-an.github.io/Pedido-de-Anime.html">📝 Pedido de Anime</a></li>
                <li><a href="https://j-s-an.github.io/Corrigir-Episodio.html">🛠️ Corrigir Episódio</a></li>
            </ul>
'@

function Normalize-HTML([string]$s) {
    # Remove espacos e quebras de linha e uniformiza acentos.
    $s = $s.Normalize([Text.NormalizationForm]::FormC)
    return [regex]::Replace($s, '\s+', '')
}

$oldNormalized = Normalize-HTML $old

$files = @(
    Get-ChildItem -LiteralPath $PSScriptRoot -Recurse -File -Filter '*.html' |
    Where-Object { $_.FullName -notmatch '[\\/]\.git[\\/]' }
)

$changed = 0
$notFound = 0
$errors = 0

# Reconhece o menu usando os links antigos, sem depender
# da formatacao ou da ordem dos atributos da tag UL.
$menuPattern = '(?s)<ul\b[^>]*\bid\s*=\s*["'']menu-links["''][^>]*>.*?</ul>'

foreach ($file in $files) {
    try {
        $content = [IO.File]::ReadAllText($file.FullName)
        $matches = [regex]::Matches($content, $menuPattern)
        $updated = $content
        $count = 0

        foreach ($m in $matches) {
            $menu = $m.Value
            $normalized = Normalize-HTML $menu

            if (
                $normalized.Contains('https://j-s-an.github.io/anime/') -and
                $normalized.Contains('https://j-s-an.github.io/anime/Lançamentos.html') -and
                $normalized.Contains('https://j-s-an.github.io/anime/lista-anime.html') -and
                $normalized.Contains('https://j-s-an.github.io/anime/Pedido-de-Anime.html') -and
                $normalized.Contains('>Início</a>') -and
                $normalized.Contains('>Lançamentos</a>') -and
                $normalized.Contains('>Lista de Anime</a>') -and
                $normalized.Contains('>Pedido de Anime</a>')
            ) {
                $updated = $updated.Replace($menu, $new.TrimEnd())
                $count++
            }
        }

        if ($count -gt 0 -and $updated -cne $content) {
            $backup = $file.FullName + '.bak'

            if (Test-Path -LiteralPath $backup) {
                $backup = $file.FullName + '.' +
                    (Get-Date -Format 'yyyyMMdd_HHmmss_fff') + '.bak'
            }

            Copy-Item -LiteralPath $file.FullName -Destination $backup

            # Mantem a codificacao UTF-8.
            $utf8 = New-Object System.Text.UTF8Encoding($false)
            [IO.File]::WriteAllText($file.FullName, $updated, $utf8)

            Write-Host "[ALTERADO] $($file.FullName)" -ForegroundColor Green
            $changed++
        }
        else {
            $notFound++
        }
    }
    catch {
        Write-Host "[ERRO] $($file.FullName): $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
}

Write-Host ''
Write-Host '========== RELATORIO =========='
Write-Host "HTML encontrados: $($files.Count)"
Write-Host "Arquivos alterados: $changed"
Write-Host "Menus nao correspondentes: $notFound"
Write-Host "Erros: $errors"
Write-Host 'Backups: arquivos com extensao .bak'