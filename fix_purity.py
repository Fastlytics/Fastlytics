import re

def fix_file(filepath, component_name):
    with open(filepath, 'r') as f:
        content = f.read()

    # Add useState to imports
    if 'import React, { useMemo, useEffect }' in content:
        content = content.replace('import React, { useMemo, useEffect }', 'import React, { useMemo, useEffect, useState }')
    elif 'import React, { useMemo, useRef, useState' in content:
        pass # already has useState
    elif 'import React, { useMemo, useRef }' in content:
        content = content.replace('import React, { useMemo, useRef }', 'import React, { useMemo, useRef, useState }')

    # Add const [now]
    if f"const {component_name} =" in content or f"const {component_name}:" in content:
        pattern = re.compile(rf"(const {component_name}\b.*?=.*?\(\).*?=>\s*{{)")
        content = pattern.sub(r"\1\n  const [now] = useState(() => Date.now());", content, count=1)

    # replace Date.now() references
    content = content.replace('<= Date.now()', '<= now')

    # Update dependencies
    if filepath == 'src/pages/Dashboard.tsx':
        content = content.replace('const now = Date.now();', '')
        # Fix the specific useMemo dependency arrays
        content = content.replace('    [schedule]\n  );', '    [schedule, now]\n  );')
        content = content.replace('  }, [isTestingMode, testingEvents]);', '  }, [isTestingMode, testingEvents, now]);')
    elif 'scheduleData' in content:
        content = content.replace('    [scheduleData]\n  );', '    [scheduleData, now]\n  );')
    else:
        content = content.replace('    [schedule]\n  );', '    [schedule, now]\n  );')

    # Fix exhaustive deps for calculateTimeLeft in calendars
    if filepath in ['src/pages/Calendar.tsx', 'src/components/mobile/MobileCalendar.tsx']:
        content = content.replace('  }, [targetDate]);', '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [targetDate]);')

    with open(filepath, 'w') as f:
        f.write(content)

files = [
    ("src/pages/Dashboard.tsx", "Dashboard"),
    ("src/components/mobile/MobileCalendar.tsx", "MobileCalendar"),
    ("src/components/mobile/MobileDriverStandings.tsx", "MobileDriverStandings"),
    ("src/components/mobile/MobileTeamStandings.tsx", "MobileTeamStandings"),
    ("src/pages/Calendar.tsx", "Calendar"),
    ("src/pages/DriverStandings.tsx", "DriverStandings"),
    ("src/pages/TeamStandings.tsx", "TeamStandings"),
]

for fp, name in files:
    fix_file(fp, name)

print("Done")
