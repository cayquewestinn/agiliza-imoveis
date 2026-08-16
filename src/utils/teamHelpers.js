export const TEAM_MEMBERS = [
  { nome: 'Cayque', cargo: 'Administrador/Agendador', usuario: 'cayque', senha: 'cayque123' },
  { nome: 'Stefanie', cargo: 'Agendador', usuario: 'stefanie', senha: 'stefanie123' },
  { nome: 'Scarlett', cargo: 'Agendador', usuario: 'scarlett', senha: 'scarlett123' },
  { nome: 'Gilmar', cargo: 'Agendador', usuario: 'gilmar', senha: 'gilmar123' },
  { nome: 'Raissa', cargo: 'Vendedor', usuario: 'raissa', senha: 'raissa123' },
  { nome: 'Ramon', cargo: 'Vendedor', usuario: 'ramon', senha: 'ramon123' },
  { nome: 'Vitória', cargo: 'Vendedor', usuario: 'vitoria', senha: 'vitoria123' },
]

export function initials(nome) {
  return nome.slice(0, 2).toUpperCase()
}

export function findByCredentials(usuario, senha) {
  return TEAM_MEMBERS.find(
    m => m.usuario.toLowerCase() === usuario.trim().toLowerCase() && m.senha === senha
  ) ?? null
}
