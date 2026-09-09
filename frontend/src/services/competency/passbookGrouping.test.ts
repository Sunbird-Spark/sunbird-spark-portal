import { describe, it, expect } from 'vitest';
import {
  buildFrameworkSections,
  buildAreaIndex,
  buildPositionList,
  frameworkCategories,
  type FrameworkVocabulary,
} from './passbookGrouping';
import { PASSBOOK_STATUS, type PassbookEntry } from '../../types/competencyServiceTypes';

const entry = (competencyId: string, frameworkId = 'fw2', over: Partial<PassbookEntry> = {}): PassbookEntry => ({
  competencyId,
  frameworkId,
  level: 'l3',
  levelIndex: 3,
  status: PASSBOOK_STATUS.attained,
  sourceType: 'ASSESSMENT',
  evidence: [],
  ...over,
});

const vocab = (over: Partial<FrameworkVocabulary> = {}): FrameworkVocabulary => ({
  frameworkId: 'fw2',
  labels: {},
  areaOf: {},
  positions: [],
  ...over,
});

describe('buildAreaIndex', () => {
  it('reads competency -> area associations', () => {
    const index = buildAreaIndex(
      [{ code: 'med', associations: [{ category: 'competencyarea', code: 'domain' }] }],
      []
    );
    expect(index).toEqual({ med: 'domain' });
  });

  // framework/v3/read exposes OUTBOUND associations only, and the CSV tool links
  // area -> competency, so the reverse direction has to be read too.
  it('reads area -> competency associations', () => {
    const index = buildAreaIndex(
      [{ code: 'med' }],
      [{ code: 'domain', associations: [{ category: 'competency', code: 'med' }] }]
    );
    expect(index).toEqual({ med: 'domain' });
  });

  it("does not let an area override a competency's own declaration", () => {
    const index = buildAreaIndex(
      [{ code: 'med', associations: [{ category: 'competencyarea', code: 'domain' }] }],
      [{ code: 'behavioural', associations: [{ category: 'competency', code: 'med' }] }]
    );
    expect(index.med).toBe('domain');
  });

  it('ignores associations of other categories', () => {
    const index = buildAreaIndex(
      [{ code: 'med', associations: [{ category: 'proficiencylevel', code: 'l3' }] }],
      []
    );
    expect(index).toEqual({});
  });

  it('is empty for a framework with no associations at all', () => {
    // fw_health_competency2 is exactly this - its sheet omitted the Area column
    expect(buildAreaIndex([{ code: 'med' }, { code: 'ipc' }], [{ code: 'domain' }])).toEqual({});
  });
});

// AxiosAdapter.mapResponse strips `result` before a caller sees the body, so the
// UNWRAPPED form is what actually arrives. Reading `result.framework` silently
// emptied every label and area: the passbook rendered de-slugged codes
// ("Health data reporting" rather than "Health Data and Reporting") and no grouping.
describe('frameworkCategories', () => {
  const categories = [{ code: 'competency', terms: [{ code: 'med', name: 'Medication Administration' }] }];

  it('reads the unwrapped shape the http adapter delivers', () => {
    expect(frameworkCategories({ framework: { categories } })).toEqual(categories);
  });

  it('still reads the enveloped shape', () => {
    expect(frameworkCategories({ result: { framework: { categories } } })).toEqual(categories);
  });

  it('returns [] rather than throwing on an unexpected body', () => {
    expect(frameworkCategories(undefined)).toEqual([]);
    expect(frameworkCategories(null)).toEqual([]);
    expect(frameworkCategories({})).toEqual([]);
    expect(frameworkCategories({ framework: {} })).toEqual([]);
  });
});

// The role picker is the only route into the gap, so it must not depend on
// competency/v1/framework/read - a separate Kong route that may not be provisioned
// (it 404s on the test cluster). The knowlg taxonomy read, already fetched here for
// labels and areas, carries the same positions.
describe('buildPositionList', () => {
  it('lists positions that declare requirements, sorted', () => {
    const positions = buildPositionList([
      { code: 'staff-nurse-icu', associations: [{ category: 'competencyrequirement', code: 'r1' }] },
      { code: 'deputy-secretary-health', associations: [{ category: 'competencyrequirement', code: 'r2' }] },
    ]);
    expect(positions).toEqual(['deputy-secretary-health', 'staff-nurse-icu']);
  });

  // A requirement-less role reports 100% ready for everyone - the misleading answer
  // a mis-authored framework produces, so it must not be selectable.
  it('excludes a position with no requirement associations', () => {
    const positions = buildPositionList([
      { code: 'real', associations: [{ category: 'competencyrequirement', code: 'r1' }] },
      { code: 'empty', associations: [] },
      { code: 'none' },
    ]);
    expect(positions).toEqual(['real']);
  });

  it('ignores associations of other categories and terms with no code', () => {
    expect(buildPositionList([{ code: 'p', associations: [{ category: 'competency', code: 'c' }] }])).toEqual([]);
    expect(buildPositionList([{ associations: [{ category: 'competencyrequirement', code: 'r' }] }])).toEqual([]);
    expect(buildPositionList([])).toEqual([]);
  });
});

describe('buildFrameworkSections', () => {
  it('groups competencies by area, ordered by the area display name', () => {
    const sections = buildFrameworkSections(
      [entry('med'), entry('comms'), entry('ipc')],
      {
        fw2: vocab({
          areaOf: { med: 'domain', ipc: 'domain', comms: 'behavioural' },
          labels: { domain: 'Domain', behavioural: 'Behavioural' },
        }),
      }
    );
    expect(sections).toHaveLength(1);
    expect(sections[0]!.grouped).toBe(true);
    expect(sections[0]!.groups.map((g) => g.areaCode)).toEqual(['behavioural', 'domain']);
    expect(sections[0]!.groups[1]!.entries.map((e) => e.competencyId)).toEqual(['ipc', 'med']);
  });

  // Rendering one "Other" heading over everything looks like a fault rather than a
  // framework that simply does not classify competencies.
  it('reports grouped=false when the framework classifies nothing', () => {
    const sections = buildFrameworkSections([entry('med'), entry('ipc')], { fw2: vocab() });
    expect(sections[0]!.grouped).toBe(false);
    expect(sections[0]!.groups).toHaveLength(1);
    expect(sections[0]!.groups[0]!.areaCode).toBe('');
  });

  it('puts unclassified competencies in a trailing group', () => {
    const sections = buildFrameworkSections(
      [entry('med'), entry('orphan')],
      { fw2: vocab({ areaOf: { med: 'domain' }, labels: { domain: 'Domain' } }) }
    );
    expect(sections[0]!.groups.map((g) => g.areaCode)).toEqual(['domain', '']);
    expect(sections[0]!.grouped).toBe(true);
  });

  // User 23 on the test cluster holds both fw_health_competency and
  // fw_health_competency2 - one flat list would mix two vocabularies.
  it('splits multiple frameworks into sections, largest first', () => {
    const sections = buildFrameworkSections(
      [entry('a', 'fwSmall'), entry('b', 'fwBig'), entry('c', 'fwBig'), entry('d', 'fwBig')],
      {}
    );
    expect(sections.map((s) => s.frameworkId)).toEqual(['fwBig', 'fwSmall']);
    expect(sections[0]!.entries).toHaveLength(3);
  });

  it('breaks a size tie deterministically by framework id', () => {
    const sections = buildFrameworkSections([entry('a', 'fwB'), entry('b', 'fwA')], {});
    expect(sections.map((s) => s.frameworkId)).toEqual(['fwA', 'fwB']);
  });

  it('groups each framework against its OWN vocabulary', () => {
    const sections = buildFrameworkSections(
      [entry('med', 'fwA'), entry('med_old', 'fwB')],
      {
        fwA: vocab({ frameworkId: 'fwA', areaOf: { med: 'domain' }, labels: { domain: 'Domain' } }),
        fwB: vocab({ frameworkId: 'fwB', areaOf: { med_old: 'clinical' }, labels: { clinical: 'Clinical' } }),
      }
    );
    const byId = Object.fromEntries(sections.map((s) => [s.frameworkId, s]));
    expect(byId['fwA']!.groups[0]!.areaCode).toBe('domain');
    expect(byId['fwB']!.groups[0]!.areaCode).toBe('clinical');
  });

  it('tolerates a framework with no vocabulary loaded yet', () => {
    const sections = buildFrameworkSections([entry('med', 'fwX')], {});
    expect(sections[0]!.grouped).toBe(false);
    expect(sections[0]!.groups[0]!.entries).toHaveLength(1);
  });

  it('returns [] for an empty passbook', () => {
    expect(buildFrameworkSections([], {})).toEqual([]);
  });
});
