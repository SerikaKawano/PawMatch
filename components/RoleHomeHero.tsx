export function RoleHomeHero({name,description}:{name:string;description:string}) {
  return <header className="role-home-hero"><div><h2>おかえりなさい、{name}</h2><p>{description}</p></div></header>;
}
