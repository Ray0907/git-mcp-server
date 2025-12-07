# TODO

## P1 - Should Have

- [ ] **Unit Tests** - Add test coverage for tools, providers, and mappers
- [ ] **GitHub Provider** - Implement GitHub provider (currently only placeholder in factory.ts)
- [ ] **CI/CD Pipeline** - Add GitHub Actions for test, build, and publish

## P2 - Nice to Have

- [ ] **delete_branch** - Delete a branch
- [ ] **get_commit** - Get single commit details
- [ ] **compare_branches** - Compare two branches (diff)
- [ ] **HTTP/SSE Transport** - Currently only stdio is implemented
- [ ] **Better Error Messages** - More user-friendly error handling
- [ ] **Rate Limiting** - Handle API rate limits gracefully
- [ ] **Retry Logic** - Auto-retry on transient failures

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
