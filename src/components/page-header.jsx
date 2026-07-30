export function PageHeader({ title, description, children, className }) {
  return (
    <div className={`flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800 pb-5 mb-6 ${className || ''}`}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">{title}</h2>
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {description}
            </p>
          )}
        </div>
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
