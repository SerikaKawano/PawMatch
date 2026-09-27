"use client";

import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import type { Pet } from "@/lib/types";
import { locationMatchesRegion, REGIONS } from "@/lib/regions";
import { PetCard } from "./PetCard";

export function PetExplorer({ pets, initialSpecies = "すべて", initialRegion = "全国" }: { pets: Pet[]; initialSpecies?: string; initialRegion?: string }) {
  const [species, setSpecies] = useState(initialSpecies);
  const [region, setRegion] = useState(initialRegion);
  const [query, setQuery] = useState("");
  const speciesValue = species === "犬" ? "Dog" : species === "猫" ? "Cat" : "すべて";
  const visible = useMemo(() => pets.filter((pet) => (speciesValue === "すべて" || pet.species === speciesValue) && locationMatchesRegion(pet.location, region) && `${pet.name} ${pet.breed} ${pet.location} ${pet.careNeeds.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [pets, query, region, speciesValue]);
  return <section className="section-block"><div className="filter-bar"><label className="search-field"><Search size={21} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="名前・種類・地域・お世話で検索" aria-label="動物を検索" /></label><div className="segmented">{["すべて", "犬", "猫"].map((item) => <button type="button" key={item} onClick={() => setSpecies(item)} className={species === item ? "selected" : ""}>{item}</button>)}</div><label className="region-filter"><MapPin size={20} /><span>地域</span><select value={region} onChange={(event) => setRegion(event.target.value)}>{REGIONS.map((item) => <option key={item}>{item}</option>)}</select></label></div><p className="result-count">{`${region}のペットを ${visible.length}件表示しています`}</p>{visible.length > 0 ? <div className="pet-grid">{visible.map((pet) => <PetCard pet={pet} key={pet.id} />)}</div> : <div className="empty-results"><PawEmpty /><strong>この地域の掲載はまだありません</strong><p>別の地域を選ぶか、全国に戻して探してください。</p></div>}</section>;
}

function PawEmpty() { return <span aria-hidden="true">🐾</span>; }
