# TMF 630 conformance

Every Armature resource follows the same TMF 630 rules, so a client that learns them once (the
Armature UI, an MCP client, a peer agent) can read and change any resource. This page lists each
rule, how Armature implements it, the tests that prove it, and the two places Armature deviates on
purpose.

Resources so far (INC-01a): `/board`, `/board/{id}/row`, `/gadgetInstance`. Every request in
[`backend/http/board-resources.http`](../../backend/http/board-resources.http) runs one of these rules
against a local backend.

## Rules

| Concern | Rule in Armature | Implemented in | Tested by |
| --- | --- | --- | --- |
| Identity | Every resource carries `id`, `href` (relative to the deployment), and `@type`; references to other resources are `{id, href, @type}` | `BoardRepresentations` | `BoardApiTest.createReturns201WithLocationIdHrefTypeAndDraftState`, `RowAndGadgetInstanceApiTest` |
| Polymorphism | `@type` on every resource; gadget instances also carry `@baseType: GadgetInstance`, and their `@type` is the gadget's own (`BarChartGadget`) | `BoardRepresentations` | `RowAndGadgetInstanceApiTest.gadgetInstancesArePlacedAndListedByBoard` |
| Creation | `POST` to the collection returns `201 Created`, a `Location` header equal to the new `href`, and the resource | the controllers | `BoardApiTest`, `RowAndGadgetInstanceApiTest.rowsAreAResourceOfTheirBoard` |
| Attribute selection | `fields=a,b` returns those attributes plus `id`, `href`, `@type`; `fields=none` returns only those three; works on lists and single reads | `QueryEngine` | `BoardApiTest.readReturnsTheBoardAndFieldsSelectsAttributes`, `QueryEngineTest` |
| Filtering | `attr=value`; `attr=a,b` (any of); `attr.gt=`, `.gte=`, `.lt=`, `.lte=`, `.ne=`; dotted paths (`board.id=`) reach nested objects and arrays; several filters must all hold. Values compare as numbers, then ISO 8601 dates, then text | `FilterParser`, `Specification` | `BoardApiTest.filtersMatchByEqualityAnyOfAndOperators`, `QueryEngineTest` |
| Sorting | `sort=title`, `sort=-lastUpdate`, several keys comma separated in priority order; missing values sort last | `QueryEngine` | `BoardApiTest.sortTakesSeveralKeysAndDescendingOrder` |
| Pagination | `offset` (default 0), `limit` (default 20, at most 100); `X-Total-Count` and `X-Result-Count` on every list; `206 Partial Content` when the page holds fewer than the total | `QueryEngine`, `TmfResponses` | `BoardApiTest.aPartialPageIs206WithBothCountHeaders` |
| Unknown attributes | A `fields`, `sort`, or filter attribute the resource does not have is the `invalid-query` problem, listing the known attributes | `QueryEngine` | `BoardApiTest.aBadQueryParameterIsInvalidQuery` |
| Partial update | `PATCH` with `application/merge-patch+json` (RFC 7386) or `application/json-patch+json` (RFC 6902); any other type is `415`. A patch is applied to the representation the client reads; only the resource's editable attributes may change, anything else is `invalid-patch` naming each attribute | `PatchStrategies`, `MergePatch`, `JsonPatch` | `BoardApiTest`, `PatchTest` |
| Deletion | `DELETE` returns `204 No Content`; deleting a row removes its gadget instances | the controllers | `BoardApiTest.deleteRemovesTheBoard`, `RowAndGadgetInstanceApiTest` |
| Methods | `GET`, `POST`, `PATCH`, `DELETE`; `PUT` is not offered (`405` with `Allow`) | Spring MVC, `ProblemAdvice` | `BoardApiTest.putIsNotOffered` |

Editable attributes: a board's `title`, `description`, `icon`, `contentWidth`; a row's
`structure`; a gadget instance's `title`, `row`, `column`, `order`, `properties`. A board's
`state` changes only through lifecycle links (INC-02).

## Deliberate deviations

| TMF 630 says | Armature does | Why |
| --- | --- | --- |
| Errors use the TMF error object | RFC 9457 problem details (`application/problem+json`), whose `type` names a help page | [ADR-0019](../adr/0019-rfc9457-problem-details.md) |
| Paths carry the major version (`/tmf-api/{api}/v4/...`) | No version in any path; the API evolves additively and through links and media types | [ADR-0020](../adr/0020-no-version-in-resource-uris.md); `ApiPathTest` enforces it |

## Not yet

- `ETag`, `If-Match`, and `412` on stale writes: INC-01b.
- HAL links (`application/hal+json`) and lifecycle transitions: INC-02.
- Task resources for long operations (`/boardComposition`): INC-03.
- The `/hub` event subscription resource: INC-09.
