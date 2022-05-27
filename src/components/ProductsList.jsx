import {
  Card,
  ResourceList,
  Pagination,
  Avatar,
  ResourceItem,
  TextStyle,
  Filters,
  ChoiceList,
  TextField,
  Button,
  Page
} from "@shopify/polaris";
import { useLazyQuery } from "@apollo/client";

import { GET_PRODUCTS } from "../graphql/requestString";
import { useCallback, useEffect, useState, useMemo } from "react";
import { Loading, useClientRouting, useRoutePropagation, useAppBridge } from "@shopify/app-bridge-react";
import ErrorBannerComponent from "./ErrorBannerComponent";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

// Variable for debouncing function with react hooks 
let timeout;

export function ProductsList() {
  const [searchParams, setSearchParams] = useSearchParams({ reverse: false });
  const [getSomeData, { loading, data, error, previousData }] = useLazyQuery(GET_PRODUCTS, {
    fetchPolicy: "no-cache"
  });

  const location = useLocation();
  const navigate = useNavigate();
  useRoutePropagation(location);
  useClientRouting({
    replace(path) {
      navigate(path);
    }
  });

  const currentParams = useMemo(() => Object.fromEntries([...searchParams]), [searchParams]);

  const [taggedWith, setTaggedWith] = useState(getParam('tag'));
  const [queryValue, setQueryValue] = useState(getParam('title'));

  useEffect(() => {
    queryRequest(getParam("first"), getParam("last"), getParam("after"), getParam("before"), getParam("reverse") === "true", getParam("sortKey"), getParam("title"), getParam("tag"));
  }, [searchParams]);

  // Handler for products PAGINATION
  const getPrevPageProducts = useCallback((data) => {
    const cursor = data.products.edges[0].cursor;
    currentParams.first = '';
    currentParams.last = 5;
    currentParams.after = '';
    currentParams.before = cursor;
    setSearchParams({ ...currentParams, last: 5, before: cursor, after: '', first: '' })
  }, [data, currentParams]);

  const getNextPageProducts = useCallback((data) => {
    const cursor = data.products.edges[data.products.edges.length - 1].cursor;
    currentParams.first = 5;
    currentParams.last = '';
    currentParams.after = cursor;
    currentParams.before = '';
    setSearchParams({ ...currentParams, first: 5, after: cursor, before: '', last: '' })
  }, [data, currentParams]);

  // Sort by Newest OR Oldest
  const handleSortValueChange = useCallback((value) => {
    currentParams.reverse = value;
    setSearchParams({ ...currentParams, reverse: value })
  }, [currentParams]);

  // Sort by Alphabet or Price
  const handleSortTypeChange = useCallback((value) => {
    const sortTypeString = value[0];
    if (getParam("reverse") === null) {
      currentParams.reverse = 'false';
    }
    currentParams.after = '';
    currentParams.before = '';
    currentParams.first = 5
    currentParams.sortKey = sortTypeString;
    setSearchParams({ ...currentParams, first: 5, before: '', after: '', sortKey: sortTypeString, reverse: currentParams.reverse });
  }, [currentParams]);

  // Filter by tags
  const handleTaggedWithChange = useCallback((value) => {
    setTaggedWith(value);
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      currentParams.tag = value;
      currentParams.before = '';
      currentParams.after = '';
      currentParams.first = 5;
      setSearchParams({ ...currentParams, first: 5, tag: value, before: '', after: '' });
    }, 1000)
  }, [currentParams]);

  // Filter by title
  const handleFiltersQueryChange = useCallback((value) => {
    setQueryValue(value);
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      currentParams.title = value;
      currentParams.before = '';
      currentParams.after = '';
      currentParams.first = 5;
      setSearchParams({ ...currentParams, first: 5, title: value, before: '', after: ''});
    }, 1000)
  }, [currentParams]);

  // Handlers for remove filters
  const handleSortTypeRemove = useCallback(() => setSearchParams({ ...currentParams, sortKey: '' }), []);
  const handleTaggedWithRemove = useCallback(() => {
    setTaggedWith('')
    currentParams.tag = '';
    setSearchParams({ ...currentParams, tag: '' })
  }, []);
  const handleQueryValueRemove = useCallback(() => {
    setQueryValue('');
    currentParams.title = '';
    setSearchParams({ ...currentParams, title: '' })
  }, []);

  const handleFiltersClearAll = useCallback(() => {

    handleSortTypeRemove();
    handleTaggedWithRemove();
    handleQueryValueRemove();
  }, [
    handleSortTypeRemove,
    handleQueryValueRemove,
    handleTaggedWithRemove,
  ]);

  const filters = [
    {
      key: "taggedWith",
      label: "Tagged with",
      filter: (
        <TextField
          label="Tagged with"
          value={taggedWith}
          onChange={handleTaggedWithChange}
          autoComplete="off"
          labelHidden
        />
      ),
      shortcut: true,
    },
    {
      key: "sortType",
      label: "Sorting type",
      filter: (
        <ChoiceList
          title="Account status"
          titleHidden
          choices={[
            { label: "Alphabet", value: "TITLE" },
          ]}
          selected={getParam("sortKey") || []}
          onChange={handleSortTypeChange}
        />
      ),
      shortcut: true,
    }
  ]

  const appliedFilters = [];
  if (!isEmpty(getParam("sortKey"))) {
    const key = "sortType";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, getParam("sortKey")),
      onRemove: handleSortTypeRemove,
    });
  }
  if (!isEmpty(getParam("tag"))) {
    const key = "taggedWith";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, getParam("tag")),
      onRemove: handleTaggedWithRemove,
    });
  }

  if (error) {
    return <ErrorBannerComponent error={error} />
  }

  if (!previousData && !data) return <Loading />;

  return (
    <Page>
      <Card >
        < ResourceList
          loading={loading}
          filterControl={
            <Filters
              queryPlaceholder="Start enter product title"
              queryValue={queryValue}
              filters={filters}
              appliedFilters={appliedFilters}
              onClearAll={handleFiltersClearAll}
              onQueryChange={handleFiltersQueryChange}
              onQueryClear={handleQueryValueRemove}
            />
          }
          sortValue={getParam("reverse") ? (getParam("reverse") === "true") : false}
          sortOptions={[
            { label: "Newest", value: true },
            { label: "Oldest", value: false },
          ]}
          onSortChange={handleSortValueChange}
          resourceName={{ singular: "customer", plural: "customers" }}
          items={data ? data.products.edges : previousData.products.edges}
          renderItem={(item) => {
            const { node: { id, title } } = item;
            const media = <Avatar customer size="medium" name={title} />;
            return (
              <ResourceItem
                id={id}
                media={media}
                accessibilityLabel={`View details for ${title}`}
                onClick={() => { navigate(`/products/${getIdNumbers(id)}`) }}
              >
                <h3>
                  <TextStyle variation="strong">{title}</TextStyle>
                </h3>
                <div>{id}</div>
              </ResourceItem>
            );
          }}
        />

        <Card sectioned>
          < Pagination
            hasPrevious={data && !loading ? data.products.pageInfo.hasPreviousPage : false}
            onPrevious={() => getPrevPageProducts(data)}
            hasNext={data && !loading ? data.products.pageInfo.hasNextPage : false}
            onNext={() => getNextPageProducts(data)}
          />
        </Card>
        <Card sectioned>
          <Button fullWidth primary onClick={() => { navigate('/create') }}>Add new product</Button>
        </Card>
      </Card>
    </Page>
  );

  function disambiguateLabel(key, value) {
    switch (key) {
      case "taggedWith":
        return `Tagged with ${value}`;
      case "sortType":
        return `Sort by ${value}`;
      default:
        return value;
    }
  }

  function isEmpty(value) {
    if (Array.isArray(value)) {
      return value.length === 0;
    } else {
      return value === "" || value == null;
    }
  }

  // Handler for change filters value
  function queryRequest(first, last, after, before, reverse, sortKey, title, tag) {
    console.log(`First: ${first}, Last: ${last}, After: ${after}, Before: ${before}, Reverse: ${reverse}, SortKey: ${sortKey}, Title: ${title}, Tag: ${tag}`);
    if (!first && !last) {
      console.log('First and last parameter doesn\'t exist.');
      getSomeData({ variables: { first: 5, last: null, after: null, reverse: reverse, sortKey: sortKey, query: null } })
      return
    }
    
    switch (true) {
      case (title !== null && tag !== null):
        console.log('Title and tag exist.');
        getSomeData({ variables: { first: first, last: last, after: after, before: before, reverse: reverse, sortKey: sortKey, query: `(title:${title}*) AND (tag:${tag})` } })
        break;

      case (title && !tag):
        console.log(`Only title exist.`);
        getSomeData({ variables: { first: first, last: last, after: after, before: before, reverse: reverse, sortKey: sortKey, query: `title:${title}*` } })
        break;

      case (tag && !title):
        console.log('Only tag exist.');
        getSomeData({ variables: { first: first, last: last, after: after, before: before, reverse: reverse, sortKey: sortKey, query: `tag:${tag}*` } })
        break;

      default:
        console.log('Field tag and title is empty.');
        getSomeData({ variables: { first: first, last: last, after: after, before: before, reverse: reverse, sortKey: sortKey, query: null } })
        break;
    }
  }

  function getIdNumbers(id) {
    const string = id;
    const res = string.replace(/\D/g, "");
    return res;
  }

  function getParam(param) {
    const urlQueryObject = Object.fromEntries([...searchParams]);
    if (urlQueryObject.hasOwnProperty(param)) {
      if (param === "first" || param === "last") {
        if (urlQueryObject[param]) {
          return parseInt(urlQueryObject[param]);
        } else {
          return null;
        }
      }
      if (param === "reverse" && urlQueryObject[param] === "") {
        return null;
      }
      if (urlQueryObject[param] === "") {
        return null;
      }
      return urlQueryObject[param];
    } else {
      return null;
    }
  }
}