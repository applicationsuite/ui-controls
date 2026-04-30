export interface IPerson {
	id: number;
	name: string;
	email: string;
	department: "Engineering" | "Design" | "Sales" | "Marketing" | "Finance";
	role: "Manager" | "Lead" | "Senior" | "Junior";
	location: "Seattle" | "Bengaluru" | "London" | "Sydney" | "Toronto";
	salary: number;
	joinedOn: string;
	active: boolean;
}

const FIRST = [
	"Aarav",
	"Ishita",
	"Kiran",
	"Maya",
	"Rohan",
	"Sara",
	"Liam",
	"Olivia",
	"Noah",
	"Emma",
	"Aiden",
	"Mia",
	"Ethan",
	"Ava",
	"Lucas",
	"Sofia",
	"Mateo",
	"Zara",
	"Arjun",
	"Priya",
];
const LAST = [
	"Sharma",
	"Patel",
	"Kumar",
	"Singh",
	"Smith",
	"Jones",
	"Brown",
	"Garcia",
	"Lopez",
	"Khan",
	"Lee",
	"Chen",
	"Davis",
	"Miller",
	"Wilson",
];
const DEPTS: IPerson["department"][] = [
	"Engineering",
	"Design",
	"Sales",
	"Marketing",
	"Finance",
];
const ROLES: IPerson["role"][] = ["Manager", "Lead", "Senior", "Junior"];
const LOCS: IPerson["location"][] = [
	"Seattle",
	"Bengaluru",
	"London",
	"Sydney",
	"Toronto",
];

const seeded = (n: number) => {
	let s = n;
	return () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
};

export const generatePeople = (count = 120): IPerson[] => {
	const rand = seeded(42);
	const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
	const out: IPerson[] = [];
	for (let i = 0; i < count; i++) {
		const first = pick(FIRST);
		const last = pick(LAST);
		const dept = pick(DEPTS);
		const role = pick(ROLES);
		const year = 2015 + Math.floor(rand() * 10);
		const month = 1 + Math.floor(rand() * 12);
		const day = 1 + Math.floor(rand() * 28);
		out.push({
			id: i + 1,
			name: `${first} ${last}`,
			email: `${first}.${last}@example.com`.toLowerCase(),
			department: dept,
			role,
			location: pick(LOCS),
			salary: 40000 + Math.floor(rand() * 160000),
			joinedOn: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
			active: rand() > 0.2,
		});
	}
	return out;
};
