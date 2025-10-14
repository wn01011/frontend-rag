import { z } from 'zod';

// Project configuration schema
export const ProjectConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string().default('1.0.0'),
  vectorDbCollection: z.string().optional(),
  priority: z.number().default(1.0),
  overrides: z.object({
    styling: z.enum(['css-modules', 'styled-components', 'tailwind', 'sass']).optional(),
    componentStructure: z.enum(['atomic', 'feature-based', 'domain-driven']).optional(),
    namingConvention: z.enum(['camelCase', 'PascalCase', 'kebab-case']).optional(),
  }).optional(),
  rules: z.object({
    enforceStrict: z.boolean().default(true),
    allowExceptions: z.array(z.string()).default([]),
    customRules: z.array(z.object({
      name: z.string(),
      pattern: z.string(),
      message: z.string(),
    })).default([]),
  }).optional(),
  guidelines: z.object({
    path: z.string().default('./.mcp-guidelines'),
    autoIndex: z.boolean().default(true),
    updateFrequency: z.enum(['on-save', 'on-commit', 'manual']).default('on-save'),
  }).optional(),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

export const defaultProjectConfig: Partial<ProjectConfig> = {
  version: '1.0.0',
  priority: 1.0,
  overrides: {
    styling: 'css-modules',
    componentStructure: 'atomic',
    namingConvention: 'PascalCase',
  },
  rules: {
    enforceStrict: true,
    allowExceptions: [],
    customRules: [],
  },
  guidelines: {
    path: './.mcp-guidelines',
    autoIndex: true,
    updateFrequency: 'on-save',
  },
};