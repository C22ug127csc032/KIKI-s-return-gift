const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

export default function FloatingField({
  as = 'input',
  label,
  icon: Icon,
  trailing,
  className = '',
  wrapperClassName = '',
  required = false,
  value,
  ...props
}) {
  const Component = as;
  const isTextarea = as === 'textarea';
  const fieldClassName = joinClasses(
    'peer input-field placeholder-transparent',
    isTextarea ? 'min-h-[108px] pt-7 pb-3 leading-5' : 'h-14 pt-6 pb-2 leading-5',
    Icon ? 'pl-10' : '',
    trailing ? 'pr-10' : '',
    'focus:border-brand-600',
    className
  );

  const labelClassName = joinClasses(
    'pointer-events-none absolute z-[1] origin-left rounded bg-white px-1 text-xs font-medium text-brand-600',
    Icon ? 'left-9' : 'left-3',
    'top-0 -translate-y-1/2'
  );

  return (
    <div className={joinClasses('relative', wrapperClassName)}>
      {Icon ? (
        <Icon
          className={joinClasses(
            'pointer-events-none absolute left-3.5 z-[1] text-gray-300 transition-colors duration-200 peer-focus:text-brand-500',
            isTextarea ? 'top-5' : 'top-1/2 -translate-y-1/2'
          )}
          size={15}
        />
      ) : null}

      <Component
        {...props}
        value={value ?? ''}
        placeholder={props.placeholder ?? ' '}
        className={fieldClassName}
      />

      <span className={labelClassName}>
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </span>

      {trailing ? (
        <div className={joinClasses('absolute right-3.5 z-[1]', isTextarea ? 'top-5' : 'top-1/2 -translate-y-1/2')}>
          {trailing}
        </div>
      ) : null}
    </div>
  );
}
