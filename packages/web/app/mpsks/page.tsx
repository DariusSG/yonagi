"use client"

import { Add, Delete, Save } from "@mui/icons-material"
import { IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from "@mui/material"
import { Name, NameType } from "@yonagi/common/common"
import {
    CallingStationIdAuthentication,
    CallingStationIdAuthenticationType,
    CallingStationIdType,
    PSKType,
} from "@yonagi/common/mpsks"
import * as E from "fp-ts/lib/Either"
import * as TE from "fp-ts/lib/TaskEither"
import * as F from "fp-ts/lib/function"
import * as PR from "io-ts/lib/PathReporter"
import * as t from "io-ts/lib/index"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useMutation, useQuery } from "react-query"

import { createOrUpdateByName, deleteByName, getAllMpsks } from "./actions"
import { useQueryHelpers, useStagedNonce } from "../../lib/client"
import { ValidatedTableCell } from "../../lib/tables"

const MPSK_QUERY_KEY = ["mpsks"]

function MpskTableRow({
    createOrUpdate,
    delete: deleteRow,
    initialValue,
    isCreateOrUpdate,
    name: initalName,
}: {
    createOrUpdate: (name: Name, mpsk: CallingStationIdAuthentication) => Promise<void>
    delete: (name: Name) => Promise<void>
    initialValue: Partial<CallingStationIdAuthentication>
    isCreateOrUpdate: "create" | "update"
    name?: Name
}): JSX.Element {
    const [name, setName] = useState<string>(initalName ?? "")
    const isNameModified = useMemo(() => name !== (initalName ?? ""), [initalName, name])

    const [callingStationId, setCallingStationId] = useState<string>(initialValue.callingStationId ?? "")
    const isCallingStationIdModified = useMemo(
        () => callingStationId !== (initialValue.callingStationId ?? ""),
        [initialValue.callingStationId, callingStationId],
    )

    const [psk, setPsk] = useState<string>(initialValue.psk ?? "")
    const isPskModified = useMemo(() => psk !== (initialValue.psk ?? ""), [initialValue.psk, psk])

    const formValidation = useMemo<t.Validation<{ name: string; mpsk: CallingStationIdAuthentication }>>(
        () =>
            F.pipe(
                E.Do,
                E.bind("name", () => NameType.decode(name)),
                E.bind("mpsk", ({ name }) =>
                    CallingStationIdAuthenticationType.decode({ callingStationId, name, psk }),
                ),
            ),
        [name, callingStationId, psk],
    )
    const formError = useMemo(
        () =>
            F.pipe(
                formValidation,
                E.mapLeft((errors) => PR.failure(errors).join("\n")),
                E.fold(
                    (error) => error,
                    () => "",
                ),
            ),
        [formValidation],
    )

    const { invalidate } = useQueryHelpers(MPSK_QUERY_KEY)
    const { mutate: submit } = useMutation({
        mutationFn: async (validation: typeof formValidation) => {
            await F.pipe(
                TE.fromEither(validation),
                TE.mapLeft((errors) => new Error(PR.failure(errors).join("\n"))),
                TE.flatMap(({ name, mpsk }) => {
                    console.log(name, mpsk)
                    return TE.tryCatch(() => createOrUpdate(name, mpsk), E.toError)
                }),
                TE.mapLeft((error) => {
                    throw error
                }),
            )()
            await invalidate()
        },
        mutationKey: ["mpsks", "create-or-update", name],
        onSettled: invalidate,
    })
    const { mutate: submitDelete } = useMutation<unknown, unknown, Name>({
        mutationFn: async (name) => {
            await deleteRow(name)
        },
        mutationKey: ["mpsks", "delete", name],
        onSettled: invalidate,
    })

    useEffect(() => {
        setName(initalName ?? "")
        setCallingStationId(initialValue.callingStationId ?? "")
        setPsk(initialValue.psk ?? "")
    }, [initalName, initialValue.callingStationId, initialValue.psk])

    return (
        <TableRow
            onKeyDown={(event) => {
                if (event.key === "Enter") submit(formValidation)
            }}
        >
            <ValidatedTableCell
                disabled={isCreateOrUpdate === "update"}
                isModified={isNameModified}
                onChange={setName}
                validate={(value) => NameType.decode(value)}
                value={name}
            />
            <ValidatedTableCell
                isModified={isCallingStationIdModified}
                onChange={setCallingStationId}
                validate={(value) => CallingStationIdType.decode(value)}
                value={callingStationId}
            />
            <ValidatedTableCell
                isModified={isPskModified}
                onChange={setPsk}
                validate={(value) => PSKType.decode(value)}
                value={psk}
            />

            {isCreateOrUpdate === "create" && (
                <TableCell>
                    <Tooltip title={formError}>
                        <IconButton
                            aria-label="Create"
                            disabled={E.isLeft(formValidation)}
                            onClick={() => {
                                submit(formValidation)
                            }}
                        >
                            <Add />
                        </IconButton>
                    </Tooltip>
                </TableCell>
            )}

            {isCreateOrUpdate === "update" && (
                <TableCell>
                    <Tooltip title={formError}>
                        <IconButton
                            aria-label="Update"
                            disabled={E.isLeft(formValidation)}
                            onClick={() => {
                                submit(formValidation)
                            }}
                        >
                            <Save />
                        </IconButton>
                    </Tooltip>
                    <IconButton
                        aria-label="Delete"
                        onClick={() => {
                            submitDelete(name)
                        }}
                    >
                        <Delete />
                    </IconButton>
                </TableCell>
            )}
        </TableRow>
    )
}

function MpskTable(): JSX.Element {
    const { nonce, increaseNonce, publishNonce } = useStagedNonce()
    const { data: mpsks } = useQuery<readonly CallingStationIdAuthentication[]>({
        queryFn: async () => await getAllMpsks(),
        queryKey: MPSK_QUERY_KEY,
        onSettled: publishNonce,
    })

    const createOrUpdateByNameWithNonce = useCallback(
        async (name: Name, mpsk: CallingStationIdAuthentication) => {
            await createOrUpdateByName(name, mpsk)
            increaseNonce()
        },
        [increaseNonce],
    )
    const deleteByNameWithNonce = useCallback(
        async (name: Name) => {
            await deleteByName(name)
            increaseNonce()
        },
        [increaseNonce],
    )

    const tableItems = useMemo(() => {
        if (mpsks === undefined) {
            return []
        }
        return mpsks.map((mpsk) => (
            <MpskTableRow
                createOrUpdate={createOrUpdateByNameWithNonce}
                delete={deleteByNameWithNonce}
                initialValue={mpsk}
                isCreateOrUpdate="update"
                key={`${mpsk.name}-${nonce}`}
                name={mpsk.name}
            />
        ))
    }, [createOrUpdateByNameWithNonce, deleteByNameWithNonce, mpsks, nonce])

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Calling Station ID</TableCell>
                        <TableCell>PSK</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tableItems}
                    <MpskTableRow
                        createOrUpdate={createOrUpdateByNameWithNonce}
                        delete={deleteByNameWithNonce}
                        initialValue={{}}
                        isCreateOrUpdate="create"
                        key={`create-${nonce}`}
                    />
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default function MpskDashboardPage() {
    return (
        <div>
            <MpskTable />
        </div>
    )
}
