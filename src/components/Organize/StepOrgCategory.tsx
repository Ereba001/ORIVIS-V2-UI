import { motion } from "motion/react"
import { useMemo } from "react"
import SearchableSelect from "../SearchableSelect"
import { COUNTRY_OPTIONS, COUNTRY_STATES } from "../../constants/countries"
import {
  type OrganizePhase1,
  type OrgSubType,
  type OrgTypeGroup,
  ORG_TYPES_BY_GROUP,
  ORG_TYPE_GROUP_LABELS,
} from "../../types/organize"

interface Props {
  data: OrganizePhase1
  onChange: (data: OrganizePhase1) => void
  onNext: () => void
  errors: Partial<Record<string, string>>
}

export default function StepOrgCategory({ data, onChange, onNext, errors }: Props) {
  const hasCategory = data.orgCategory !== ''
  const subTypeOptions = useMemo(
    () => (hasCategory ? ORG_TYPES_BY_GROUP[data.orgCategory as OrgTypeGroup] : []),
    [data.orgCategory, hasCategory]
  )

  const update = <K extends keyof OrganizePhase1>(key: K, value: OrganizePhase1[K]) =>
    onChange({ ...data, [key]: value })

  const handleCategoryChange = (group: OrgTypeGroup) => {
    onChange({
      ...data,
      orgCategory: group,
      organizationType: '',
    })
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onNext() }} className="space-y-4">
      <div>
        <label htmlFor="org-sector" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">
          Organization Sector
        </label>
        <select
          id="org-sector"
          name="orgSector"
          required
          value={data.orgCategory}
          onChange={(e) => handleCategoryChange(e.target.value as OrgTypeGroup)}
          className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all appearance-none font-medium"
        >
          <option value="" disabled>Select your organization sector</option>
          {(Object.keys(ORG_TYPE_GROUP_LABELS) as OrgTypeGroup[]).map((group) => (
            <option key={group} value={group}>{ORG_TYPE_GROUP_LABELS[group]}</option>
          ))}
        </select>
        {errors.orgCategory && <p className="text-status-error text-[10px] mt-1">{errors.orgCategory}</p>}
        {data.orgCategory && (
          <p className="text-[10px] text-brand-text-muted mt-1.5 italic">
            {data.orgCategory === 'ACADEMIC' && 'e.g. Universities, Polytechnics, Colleges, Vocational Institutes, Seminaries, Academies'}
            {data.orgCategory === 'GOVERNMENT' && 'e.g. Ministries, Departments, Agencies, Commissions, Parliaments, Courts, State enterprises'}
            {data.orgCategory === 'CORPORATE' && 'e.g. Private Companies, Public Corporations, Multinationals, SMEs, Partnerships, Professional Firms'}
            {data.orgCategory === 'CIVIC' && 'e.g. NGOs, Charities, Foundations, Religious Organizations, Community groups, Cultural societies, Sports clubs'}
            {data.orgCategory === 'OTHER' && 'e.g. Any other type of organization not listed above'}
          </p>
        )}
      </div>

      {hasCategory && (
        <div>
          <label htmlFor="org-type" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">
            Organization Type
          </label>
          <select
            id="org-type"
            name="orgType"
            required
            value={data.organizationType}
            onChange={(e) => update("organizationType", e.target.value as OrgSubType | "")}
            className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all appearance-none font-medium"
          >
            <option value="" disabled>Select your organization type</option>
            {subTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.organizationType && <p className="text-status-error text-[10px] mt-1">{errors.organizationType}</p>}
        </div>
      )}

      <div>
        <label htmlFor="org-name" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">
          Organization Name
        </label>
        <input
          id="org-name"
          name="organizationName"
          type="text"
          required
          value={data.organizationName}
          onChange={(e) => update("organizationName", e.target.value)}
          placeholder="Enter the full legal name of your organization"
          className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium"
        />
        {errors.organizationName && <p className="text-status-error text-[10px] mt-1">{errors.organizationName}</p>}
      </div>

      <div>
        <label htmlFor="country" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">
          Country
        </label>
        <SearchableSelect
          id="country"
          options={COUNTRY_OPTIONS.map((c) => ({ value: c, label: c }))}
          value={data.country}
          onChange={(v) => {
            onChange({ ...data, country: v, state: '', city: '' })
          }}
          placeholder="Select your country of operation"
        />
        {errors.country && <p className="text-status-error text-[10px] mt-1">{errors.country}</p>}
      </div>

      <div>
        <label htmlFor="state" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">
          State / Region
        </label>
        {COUNTRY_STATES[data.country]?.length ? (
          <SearchableSelect
            id="state"
            options={COUNTRY_STATES[data.country].map((s) => ({ value: s, label: s }))}
            value={data.state}
            onChange={(v) => update("state", v)}
            placeholder="Select your state / region"
          />
        ) : (
          <input
            id="state"
            name="state"
            type="text"
            value={data.state}
            onChange={(e) => update("state", e.target.value)}
            placeholder={data.country ? "Enter your state / region" : "Select a country first to see available states"}
            className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium"
          />
        )}
      </div>

      <div>
        <label htmlFor="city" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">
          City
        </label>
        <input
          id="city"
          name="city"
          type="text"
          value={data.city}
          onChange={(e) => update("city", e.target.value)}
          placeholder="Enter your city / town"
          className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium"
        />
      </div>

      <div>
        <label htmlFor="website" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">
          Website
        </label>
        <input
          id="website"
          name="website"
          type="url"
          value={data.website}
          onChange={(e) => update("website", e.target.value)}
          placeholder="Enter your organization's website URL (if any)"
          className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium"
        />
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-xl py-3.5 text-xs font-bold uppercase tracking-widest shadow-md transition-all duration-200 cursor-pointer mt-6"
      >
        Continue to Branding
      </motion.button>
    </form>
  )
}
