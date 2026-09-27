export function RoleHomeHero({name,description}:{name:string;description:string}) {
  return <header className="role-home-hero"><div><h2><span>おかえりなさい、</span><span>{name}</span></h2><p>{description}</p></div></header>;
}
