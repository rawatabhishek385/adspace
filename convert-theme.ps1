$files = @(
    'src\app\register\page.tsx',
    'src\app\forgot-password\page.tsx',
    'src\app\reset-password\page.tsx',
    'src\app\verify-email\page.tsx',
    'src\app\error.tsx',
    'src\app\not-found.tsx',
    'src\app\global-error.tsx',
    'src\app\listings\page.tsx',
    'src\app\listings\loading.tsx',
    'src\app\listings\[id]\page.tsx',
    'src\app\dashboard\page.tsx',
    'src\app\dashboard\layout.tsx',
    'src\app\dashboard\SignOutButton.tsx',
    'src\app\dashboard\error.tsx',
    'src\app\admin\layout.tsx',
    'src\app\admin\page.tsx',
    'src\app\admin\error.tsx',
    'src\app\admin\categories\CategoryManager.tsx',
    'src\app\admin\categories\page.tsx',
    'src\app\admin\users\UserTable.tsx',
    'src\app\admin\reviews\page.tsx',
    'src\components\listings\ListingFilters.tsx',
    'src\components\listings\SearchBar.tsx',
    'src\components\listings\ListingSkeletons.tsx',
    'src\components\listings\Pagination.tsx',
    'src\components\listings\ListingViewToggle.tsx',
    'src\components\listings\ListingMediaGallery.tsx',
    'src\components\listings\ContactOwnerModal.tsx',
    'src\components\listings\ListingForm.tsx',
    'src\components\listings\FeaturedListings.tsx',
    'src\components\dashboard\DashboardSidebar.tsx',
    'src\components\profile\ProfileForm.tsx',
    'src\components\messages\ConversationsSidebar.tsx',
    'src\components\messages\ConversationListingHeader.tsx',
    'src\components\messages\MessageInput.tsx',
    'src\components\reviews\ReviewModal.tsx',
    'src\components\reviews\ListingReviewModal.tsx',
    'src\components\reviews\ListingReviewButton.tsx',
    'src\components\reviews\ProfileReviewEditButton.tsx',
    'src\components\reports\ReportListingModal.tsx',
    'src\components\reports\ReportUserModal.tsx',
    'src\components\reports\ReportListingButton.tsx',
    'src\components\providers\SessionGuard.tsx',
    'src\components\admin\AdminSidebar.tsx',
    'src\components\layout\Breadcrumbs.tsx',
    'src\app\dashboard\reviews\page.tsx',
    'src\app\dashboard\messages\layout.tsx',
    'src\app\dashboard\messages\[conversationId]\page.tsx',
    'src\app\dashboard\listings\page.tsx',
    'src\app\dashboard\listings\create\page.tsx',
    'src\app\dashboard\listings\[id]\edit\page.tsx',
    'src\app\dashboard\profile\page.tsx',
    'src\app\profile\[id]\page.tsx',
    'src\app\admin\listings\ListingModerationTable.tsx',
    'src\app\admin\reports\page.tsx',
    'src\app\admin\messages\page.tsx'
)

$basePath = $PSScriptRoot

# Ordered replacements (most specific first to avoid double-replacing)
$replacements = [ordered]@{
    'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' = 'bg-gradient-to-br from-slate-50 to-emerald-50/30'
    'bg-slate-900/80 backdrop-blur-xl' = 'bg-white/80 backdrop-blur-xl'
    'bg-slate-800 animate-pulse' = 'bg-slate-200 animate-pulse'
    'bg-slate-900' = 'bg-white'
    'bg-slate-800' = 'bg-white'
    'bg-white/5 backdrop-blur-xl border border-white/10' = 'bg-white border border-slate-200 shadow-sm'
    'bg-white/5 backdrop-blur-xl' = 'bg-white shadow-sm'
    'bg-white/5' = 'bg-slate-50'
    'bg-white/10' = 'bg-slate-100'
    'border-white/10' = 'border-slate-200'
    'border-white/5' = 'border-slate-100'
    'hover:bg-white/10' = 'hover:bg-slate-100'
    'hover:bg-white/5' = 'hover:bg-slate-50'
    'text-white font-bold' = 'text-slate-800 font-bold'
    'text-white font-semibold' = 'text-slate-800 font-semibold'
    'text-white font-medium' = 'text-slate-700 font-medium'
    'text-white truncate' = 'text-slate-800 truncate'
    'hover:text-white' = 'hover:text-slate-800'
    'text-slate-300' = 'text-slate-600'
    'text-slate-400' = 'text-slate-500'
    'text-emerald-400' = 'text-emerald-500'
    'hover:text-emerald-300' = 'hover:text-emerald-600'
    'hover:text-emerald-400' = 'hover:text-emerald-500'
    'hover:border-emerald-500/30' = 'hover:border-emerald-300'
    'bg-emerald-500/10' = 'bg-emerald-50'
    'border-emerald-500/30' = 'border-emerald-200'
    'bg-emerald-500/20' = 'bg-emerald-100'
    'text-red-400' = 'text-red-500'
    'hover:text-red-300' = 'hover:text-red-600'
    'bg-red-500/10' = 'bg-red-50'
    'border-red-500/30' = 'border-red-200'
    'bg-red-500/5' = 'bg-red-50'
    'border-red-500/20' = 'border-red-200'
    'hover:bg-red-500/10' = 'hover:bg-red-100'
    'placeholder-slate-500' = 'placeholder-slate-400'
    'ring-slate-900' = 'ring-white'
    'ring-2 ring-slate-800' = 'ring-2 ring-white'
    'shadow-2xl' = 'shadow-xl'
    'divide-white/5' = 'divide-slate-100'
    'hover:border-emerald-500/40' = 'hover:border-emerald-300'
    'bg-amber-500/20' = 'bg-amber-100'
    'text-amber-400' = 'text-amber-500'
    'bg-blue-500/20' = 'bg-blue-100'
    'text-blue-400' = 'text-blue-500'
    'bg-purple-500/20' = 'bg-purple-100'
    'text-purple-400' = 'text-purple-500'
}

$count = 0
foreach ($f in $files) {
    $path = Join-Path $basePath $f
    if (Test-Path -LiteralPath $path) {
        $content = Get-Content -LiteralPath $path -Raw -Encoding UTF8
        $changed = $false
        foreach ($k in $replacements.Keys) {
            if ($content.Contains($k)) {
                $content = $content.Replace($k, $replacements[$k])
                $changed = $true
            }
        }
        if ($changed) {
            Set-Content -LiteralPath $path -Value $content -NoNewline -Encoding UTF8
            $count++
            Write-Host "Updated: $f"
        }
    } else {
        Write-Host "Skipped (not found): $f"
    }
}
Write-Host "`nTotal files updated: $count"
