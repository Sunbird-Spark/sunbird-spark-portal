import 'vitest'
import type { AxeResults } from 'axe-core'

declare module 'vitest' {
  export interface Assertion<T = any> {
    toHaveNoViolations(): Promise<void>;
  }
}
