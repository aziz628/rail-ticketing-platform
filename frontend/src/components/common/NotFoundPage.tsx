
export const NotFoundPage = () => {
  return (
      <div className="flex h-screen justify-center items-center text-center space-y-6 max-w-lg mx-auto">
        <div className="space-y-2">
          <h1 className="text-9xl font-black text-slate-400 select-none">404</h1>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Page Introuvable
          </h2>
          <p className="text-slate-500 text-lg">
            Désolé, nous n'avons pas trouvé la page que vous recherchez.
          </p>
        </div>

      </div>
  );
};
