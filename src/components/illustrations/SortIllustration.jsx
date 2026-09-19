/** Small editorial illustration used in empty and guidance states. */
export default function SortIllustration({ className = "" }) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      className={className}
      role="img"
      aria-label="Illustration of a recycling bin and sorted materials"
    >
      <rect width="240" height="180" rx="28" fill="#EEF5EF" />
      <path d="M18 142c42-21 73 9 108-4 35-13 62-14 96 2" stroke="#D6E6D8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="48" cy="54" r="17" fill="#DDECE0" />
      <path d="M40 55c3-11 15-14 22-4-4 1-8 4-10 9-4-3-8-5-12-5Z" fill="#477A5C" />

      <path d="M91 55h58l-7 80a8 8 0 0 1-8 7h-28a8 8 0 0 1-8-7l-7-80Z" fill="#FFFFFF" stroke="#477A5C" strokeWidth="3" />
      <path d="M84 49h72l-4 10H88l-4-10Z" fill="#A7C7B0" stroke="#477A5C" strokeWidth="3" strokeLinejoin="round" />
      <path d="M107 43h26" stroke="#477A5C" strokeWidth="4" strokeLinecap="round" />
      <path d="m120 77 14 8-14 8M120 93l-14-8 14-8" stroke="#477A5C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M111 116h18" stroke="#C9DECF" strokeWidth="5" strokeLinecap="round" />
      <circle cx="105" cy="148" r="6" fill="#355F46" />
      <circle cx="135" cy="148" r="6" fill="#355F46" />

      <g transform="rotate(-16 183 89)">
        <path d="M172 47h21v36h-21z" fill="#DCEBFD" stroke="#3B82F6" strokeWidth="2.5" />
        <path d="M172 58h21" stroke="#93C5FD" strokeWidth="2" />
        <path d="M177 42h11v6h-11z" fill="#3B82F6" />
      </g>
      <g transform="rotate(15 64 115)">
        <path d="M52 96h24v32H52z" fill="#FBE8DE" stroke="#D27C5C" strokeWidth="2.5" />
        <path d="M52 103h24" stroke="#E5A083" strokeWidth="2" />
      </g>
    </svg>
  );
}
