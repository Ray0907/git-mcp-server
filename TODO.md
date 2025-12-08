# TODO

## Completed (Must Have)

- [x] **Unit Tests (Mappers)** - GitLab mapper tests (37 tests) + GitHub mapper tests (39 tests)
- [x] **Unit Tests (Tools)** - Tool handler tests (133 tests)
- [x] **GitHub Provider** - Implement GitHub provider with full API support
- [x] **GitLab Provider** - Full GitLab API support

## P1 - Should Have

- [ ] **CI/CD Pipeline** - Add GitHub Actions for test, build, and publish
- [ ] **Integration Tests** - Add integration tests for providers (requires live API)

## P2 - Nice to Have

- [ ] **delete_branch** - Delete a branch
- [ ] **get_commit** - Get single commit details
- [ ] **compare_branches** - Compare two branches (diff)
- [ ] **HTTP/SSE Transport** - Currently only stdio is implemented
- [ ] **Better Error Messages** - More user-friendly error handling
- [ ] **Rate Limiting** - Handle API rate limits gracefully
- [ ] **Retry Logic** - Auto-retry on transient failures
- [ ] **Multi-Provider Support** - Use GitHub and GitLab simultaneously

## P3 - Future Enhancements

- [ ] **list_tags** - List repository tags
- [ ] **create_tag** - Create a new tag
- [ ] **delete_tag** - Delete a tag
- [ ] **fork_repository** - Fork a repository
- [ ] **trigger_pipeline** - Manually trigger CI pipeline
- [ ] **cancel_pipeline** - Cancel a running pipeline
- [ ] **retry_job** - Retry a failed job
- [ ] **Webhooks Support** - Listen to Git events
- [ ] **Caching** - Cache frequently accessed data
- [ ] **Batch Operations** - Batch multiple operations in one request
