# JSONPlaceholder Todos Workflow Design

## Goal

Create a small demo n8n workflow through the `n8n-local` MCP server.

## Workflow Shape

The workflow uses three nodes:

- `Manual Trigger`
- `HTTP Request`
- `Set`

## Behavior

1. The workflow starts manually.
2. It fetches the todo list from `https://jsonplaceholder.typicode.com/todos`.
3. It transforms the result into a cleaner summary object with:
   - total todo count
   - completed count
   - pending count
   - a short preview list of titles

## Notes

- This should be saved in the default personal n8n project.
- The workflow should be validated before creation.
