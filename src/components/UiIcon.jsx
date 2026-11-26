const paths = {
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  edit: <><path d="m15 5 4 4M4 20l4-1L21 6a2.8 2.8 0 0 0-4-4L4 15l-1 6M12 21h9" /></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6" /></>,
  chevronLeft: <path d="m14 6-6 6 6 6" />,
  chevronRight: <path d="m10 6 6 6-6 6" />,
  chevronDown: <polyline points="6 9 12 15 18 9" />,
  sort: <><path d="m8 9 4-4 4 4m-8 6 4 4 4-4" /></>,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  bill: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 7h6M9 11h6M9 15h3" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-3-5.2" /></>,
  wallet: <><rect x="3" y="5" width="18" height="15" rx="3" /><path d="M3 8V6a2 2 0 0 1 2-2h13M21 11h-6v5h6" /><path d="M17 13.5h.01" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4M17 3v4M3 11h18M8 15h2M14 15h2" /></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9" /></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  arrowUp: <path d="M6 18 18 6M6 6h12v12" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 7 9 6 9-6" /></>,
  chat: <><rect x="3" y="4" width="18" height="14" rx="3" /><path d="M7 18v3l4-3h7a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" />,
  water: <path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13ZM8 15a4 4 0 0 0 4 4" />,
  chart: <><rect x="3" y="13" width="4" height="8" rx="1" /><rect x="10" y="8" width="4" height="13" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  stopwatch: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2" /><path d="M10 2h4" /><path d="M12 2v3" /></>,
  alertTriangle: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  userGroup: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  logo: (
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.178 8.5c3.2 0 4.822 2.2 4.822 4.5s-1.622 4.5-4.822 4.5c-3.1 0-4.664-3.5-6.178-7-1.514-3.5-3.078-7-6.178-7C2.622 3.5 1 5.7 1 8s1.622 4.5 4.822 4.5c3.1 0 4.664-3.5 6.178-7 1.514-3.5 3.078-7 6.178-7z" transform="translate(0, 3)" />
    </g>
  ),
  sidebarToggle: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 3v18" /></>,
  attendance: <><circle cx="10" cy="8" r="3.5" /><path d="M3 20v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" /><path d="M16 11l2 2 4-4" /></>,
  timesheets: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></>,
  overtime: <><circle cx="12" cy="13" r="8" /><polyline points="12 9 12 13 14.5 15" /><path d="M5 3.5 2.5 6" /><path d="M21.5 6 19 3.5" /></>,
  shiftRoster: <><rect x="3" y="4" width="18" height="17" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01M16 17.5h.01" /></>,
  payroll: <><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><circle cx="7" cy="15" r="1" /></>,
  businessTravel: <><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" /></>,
  cashAdvance: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></>,
  employeeDirectory: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  recruitment: <><circle cx="10" cy="8" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" /><circle cx="18" cy="11" r="3" /><line x1="20.2" y1="13.2" x2="22.5" y2="15.5" /></>,
  performance: <><circle cx="12" cy="12" r="9" /><polyline points="7.5 13.5 10.5 10 13.5 12 16.5 8.5" /></>,
  leaveManagement: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  reports: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  announcements: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="13" x2="13" y2="13" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  excel: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /><polyline points="10 9 9 9 8 9" /></>,
  receipt: <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><line x1="8" y1="7" x2="16" y2="7" /><line x1="8" y1="11" x2="16" y2="11" /><line x1="8" y1="15" x2="13" y2="15" /></>,
  discount: <><circle cx="9" cy="9" r="2" /><path d="m19 5-7 7" /><circle cx="15" cy="15" r="2" /><rect x="3" y="3" width="18" height="18" rx="3" /></>,
  tag: <><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8 8a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828l-8-8z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /></>,
  userX: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" y1="8" x2="22" y2="13" /><line x1="22" y1="8" x2="17" y2="13" /></>,
}

function UiIcon({ name, className = '', ...props }) {
  return (
    <svg
      className={`ui-icon ${className}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths[name] || paths.dashboard}
    </svg>
  )
}

export default UiIcon
