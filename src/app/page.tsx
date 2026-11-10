export default function Home() {
  return (
    <div className="flex min-h-screen font-sans bg-zinc-50">
      
      {/* Lado Esquerdo - Marca VetCare (Azul) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#5575F1] relative flex-col justify-between p-16 text-white overflow-hidden">
        
        {/* Formas geométricas no topo */}
        <div className="absolute top-0 left-0 w-full h-48 flex">
          <div className="w-1/3 h-full bg-[#B2D296]"></div>
          <div className="w-1/3 h-24 bg-[#0A3D91]"></div>
          <div className="w-1/3 h-full bg-[#4EBAF8]"></div>
        </div>

        {/* Ícone da Pata (SVG simples) */}
        <div className="mt-32 z-10">
          <svg className="w-24 h-24 text-white fill-current" viewBox="0 0 24 24">
            <path d="M12 8.5c-1.3 0-2.4 1.1-2.4 2.4 0 1.3 1.1 2.4 2.4 2.4s2.4-1.1 2.4-2.4c0-1.3-1.1-2.4-2.4-2.4zM6.8 7.3c-1.1 0-2 .9-2 2 0 1.1.9 2 2 2 1.1 0 2-.9 2-2 0-1.1-.9-2-2-2zM17.2 7.3c-1.1 0-2 .9-2 2 0 1.1.9 2 2 2 1.1 0 2-.9 2-2 0-1.1-.9-2-2-2zM4 14.5c-1.3 0-2.4 1.1-2.4 2.4 0 1.3 1.1 2.4 2.4 2.4s2.4-1.1 2.4-2.4c0-1.3-1.1-2.4-2.4-2.4zM20 14.5c-1.3 0-2.4 1.1-2.4 2.4 0 1.3 1.1 2.4 2.4 2.4s2.4-1.1 2.4-2.4c0-1.3-1.1-2.4-2.4-2.4zM12 14c-3.3 0-6 2.7-6 6 0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2 0-3.3-2.7-6-6-6z" />
          </svg>
        </div>

        {/* Textos de apresentação */}
        <div className="z-10 mt-auto">
          <p className="text-sm font-semibold tracking-widest mb-1 opacity-90">SISTEMA DE GESTÃO VETERINÁRIA</p>
          <h1 className="text-7xl font-black mb-4 tracking-tighter">VETCARE</h1>
          <p className="text-lg opacity-90 max-w-md">Tutores, animais, agenda, prontuários e pagamentos em um só lugar.</p>
        </div>
      </div>

      {/* Lado Direito - Formulário de Login */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative">
        
        <div className="w-full max-w-md">
          {/* Cabeçalho */}
          <p className="text-[10px] font-bold text-blue-600 mb-2 tracking-widest uppercase">REQ 02 · AUTENTICAR USUÁRIO</p>
          <h2 className="text-4xl font-bold text-[#0A3D91] mb-2">Entrar</h2>
          <p className="text-zinc-500 mb-8 text-sm">Use as credenciais fornecidas pelo administrador da clínica.</p>

          {/* Campos de digitação */}
          <form className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-800">E-mail</label>
              <input 
                type="email" 
                placeholder="marina.lopes@clinica.com.br" 
                className="p-3 border border-zinc-300 rounded-md text-zinc-800 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-zinc-800">Senha</label>
                <a href="#" className="text-sm text-blue-700 font-semibold hover:underline">Esqueci minha senha</a>
              </div>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="p-3 border border-zinc-300 rounded-md text-zinc-800 outline-none focus:border-blue-500"
              />
            </div>

            <button type="button" className="bg-[#084BBF] hover:bg-blue-800 text-white font-semibold py-3 rounded-md mt-2">
              Entrar
            </button>
          </form>

          {/* Aviso HTTPS */}
          <div className="mt-6 bg-[#EBEFFF] p-4 rounded-md flex gap-3 text-sm text-zinc-600">
            <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p>Conexão protegida por HTTPS. Seu acesso é definido pelo perfil: Administrador, Recepcionista ou Veterinário.</p>
          </div>

          {/* Área de Demonstração */}
          <div className="mt-10 border-t border-zinc-200 pt-6">
            <p className="text-[10px] font-bold text-zinc-400 mb-4 tracking-widest uppercase">DEMONSTRAÇÃO · ENTRAR COMO</p>
            <div className="flex gap-2">
              <button className="flex-1 border border-zinc-300 rounded-md py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100">Recepcionista</button>
              <button className="flex-1 border border-zinc-300 rounded-md py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100">Veterinário</button>
              <button className="flex-1 border border-zinc-300 rounded-md py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100">Administrador</button>
            </div>
          </div>
        </div>

        {/* Botão flutuante Telas do protótipo */}
        <div className="absolute bottom-6 right-6 hidden md:block">
          <button className="bg-[#0A3D91] text-white text-sm font-semibold py-3 px-6 rounded-full shadow-lg">
            Telas do protótipo
          </button>
        </div>
      </div>

    </div>
  );
}