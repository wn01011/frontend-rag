# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-10-17

### Added
- **Smart Collection Management**: New `ensureProjectCollection` method that intelligently handles collection lifecycle
  - Automatically checks if a collection exists for a project
  - Creates new collections when needed
  - Auto-indexes project guidelines when collection is empty
  - Reuses existing data when collection already has documents

### Changed
- **Improved `loadProject` method**: Now uses `ensureProjectCollection` for better collection management
- **Enhanced `indexGuidelines` method**: 
  - More detailed logging of collection status
  - Better handling of existing vs. new collections
  - Clearer messages about when re-indexing is needed
  - Now updates the collections map after creating/getting collection

### Fixed
- Fixed issue where collections weren't properly checked for existence before indexing
- Removed duplicate code in `indexGuidelines` method
- Improved error handling for collection operations

### Improved
- Better logging throughout collection lifecycle
- More informative status messages for users
- Clearer distinction between creating, finding, and reusing collections

## [1.0.0] - 2025-10-14

### Initial Release
- MCP server for frontend development guidelines
- ChromaDB integration for vector storage
- OpenAI embeddings for semantic search
- Project-aware configuration system
- Multiple MCP tools (styling, templates, validation, etc.)
- Auto-detection of project context
- Default and project-specific guideline collections
