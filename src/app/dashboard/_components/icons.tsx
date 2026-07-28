type IconProps = { className?: string };

const base = "h-4 w-4";

export function PlusIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 4v12M4 10h12" />
    </svg>
  );
}

export function PencilIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 3.5a1.914 1.914 0 0 1 2.706 2.706L6 16.5l-4 1 1-4L13.5 3.5Z"
      />
    </svg>
  );
}

export function CheckIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

export function XMarkIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

export function BanIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="7" />
      <path strokeLinecap="round" d="M5.5 5.5l9 9" />
    </svg>
  );
}

export function EyeIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z"
      />
      <circle cx="10" cy="10" r="2.25" />
    </svg>
  );
}

export function ArrowLeftIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5l-5 5 5 5M7 10h11" />
    </svg>
  );
}

export function TrashIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m-6.5 0 .6 9.4A2 2 0 0 0 8.1 17.2h3.8a2 2 0 0 0 2-1.8L14.5 6"
      />
    </svg>
  );
}

export function ArrowPathIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v4h4M16 16v-4h-4M4.5 8.5a6 6 0 0 1 10.6-2.7M15.5 11.5a6 6 0 0 1-10.6 2.7"
      />
    </svg>
  );
}
