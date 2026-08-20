# Roda seed-profiles.mjs pedindo a service_role key de forma oculta (sem
# mostrar na tela e sem precisar colar em nenhum comando visivel).
# Uso: no terminal, dentro da pasta agiliza-imoveis, rode:
#   .\scripts\run-seed-profiles.ps1

$secure = Read-Host -AsSecureString "Cole a service_role key (nao aparece na tela)"
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$env:SUPABASE_SERVICE_ROLE_KEY = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

node scripts/seed-profiles.mjs

Remove-Item Env:\SUPABASE_SERVICE_ROLE_KEY
